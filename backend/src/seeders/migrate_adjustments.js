/**
 * Migration: adjustments → finalScores
 *
 * Mengubah data lama di collection AssessmentSessions:
 *  1. Setiap entry `adjustments` (manual override) → `finalScores` dengan source='adjusted'
 *  2. Menghitung modus dari AssessmentResponses untuk setiap subdimensi
 *     yang BELUM punya entry 'adjusted' → tambahkan dengan source='majority'
 *  3. Menghapus field `adjustments` lama setelah migrasi selesai
 *
 * Cara jalankan:
 *   node src/seeders/migrate_adjustments.js
 *
 * Aman dijalankan berkali-kali (idempotent):
 *   - Jika session sudah punya finalScores, akan di-skip
 *   - Jika tidak ada adjustments lama, hanya majority yang dihitung
 */

import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME     = process.env.DB_NAME || "Karta";

// ─── Mode helper ──────────────────────────────────────────────────────────────
function getMode(arr) {
  if (!arr.length) return null;
  const freq = {};
  let maxFreq = 0, modeVal = arr[0];
  for (const v of arr) {
    freq[v] = (freq[v] ?? 0) + 1;
    if (freq[v] > maxFreq) { maxFreq = freq[v]; modeVal = v; }
  }
  return modeVal;
}

async function migrate() {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  console.log("✅ Connected to MongoDB:", DB_NAME);

  const db = mongoose.connection.db;
  const sessions   = db.collection("assessmentsessions");
  const responses  = db.collection("assessmentresponses");

  const allSessions = await sessions.find({}).toArray();
  console.log(`📦 Total sessions ditemukan: ${allSessions.length}`);

  let migrated = 0;
  let skipped  = 0;

  for (const session of allSessions) {
    const sessionId = session._id;

    // ── Idempotency check ──────────────────────────────────────────────────
    // Skip jika finalScores sudah ada dan berisi data
    if (Array.isArray(session.finalScores) && session.finalScores.length > 0) {
      console.log(`  ⏭️  [${sessionId}] "${session.title}" — sudah punya finalScores (${session.finalScores.length} entries), skip.`);
      skipped++;
      continue;
    }

    const finalScores = [];
    const processedKeys = new Set(); // untuk deteksi duplikat

    // ── 1. Migrasi adjustments lama → finalScores source='adjusted' ───────
    const oldAdjustments = session.adjustments ?? [];
    for (const adj of oldAdjustments) {
      const key = `${adj.dimension}__${adj.subdimension}`;
      processedKeys.add(key);
      finalScores.push({
        _id:             new mongoose.Types.ObjectId(),
        dimension:       adj.dimension,
        subdimension:    adj.subdimension,
        finalLevelIndex: adj.finalLevelIndex,
        source:          "adjusted",
        adjustedBy:      adj.adjustedBy ?? null,
        adjustedAt:      adj.adjustedAt ?? new Date(),
      });
    }

    // ── 2. Hitung majority dari responses ──────────────────────────────────
    const sessionResponses = await responses.find({ session: sessionId }).toArray();

    // Build answersMap { "dimId__subId": [levelIndex, ...] }
    const answersMap = {};
    for (const resp of sessionResponses) {
      for (const item of resp.responses ?? []) {
        const key = `${item.dimension}__${item.subdimension}`;
        if (!answersMap[key]) answersMap[key] = [];
        answersMap[key].push(item.selectedLevelIndex);
      }
    }

    // Tambah majority hanya untuk sub-dimensi yang BELUM di-adjust
    for (const [key, votes] of Object.entries(answersMap)) {
      if (processedKeys.has(key)) continue; // skip, sudah ada entry adjusted

      const majorityIdx = getMode(votes);
      if (majorityIdx === null || majorityIdx === undefined) continue;

      const [dimId, subId] = key.split("__");
      finalScores.push({
        _id:             new mongoose.Types.ObjectId(),
        dimension:       new mongoose.Types.ObjectId(dimId),
        subdimension:    new mongoose.Types.ObjectId(subId),
        finalLevelIndex: majorityIdx,
        source:          "majority",
        adjustedBy:      null,
        adjustedAt:      null,
      });
    }

    // ── 3. Update session: set finalScores, unset adjustments ─────────────
    await sessions.updateOne(
      { _id: sessionId },
      {
        $set:   { finalScores },
        $unset: { adjustments: "" },
      }
    );

    const adjCount      = oldAdjustments.length;
    const majorityCount = finalScores.length - adjCount;
    console.log(
      `  ✅ [${sessionId}] "${session.title}" — ` +
      `${adjCount} adjusted + ${majorityCount} majority = ${finalScores.length} finalScores`
    );
    migrated++;
  }

  console.log(`\n🎉 Migrasi selesai!`);
  console.log(`   Migrated : ${migrated} sessions`);
  console.log(`   Skipped  : ${skipped} sessions (sudah punya finalScores)`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
