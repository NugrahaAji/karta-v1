import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "Karta";

// ── Konfigurasi akun Super Admin ────────────────────────────────────────────
// Ubah password sebelum dijalankan di production!
const SUPER_ADMIN = {
  name: "Super Admin",
  email: "superadmin@karta.dev",
  password: "SuperAdmin123!",
  role: "superAdmin",
  accountRole: "superAdmin",
  isVerified: true,
  isActive: true,
  plan: "enterprise",
};

async function seedSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log("✅ Connected to MongoDB:", DB_NAME);

    const existing = await User.findOne({ email: SUPER_ADMIN.email });

    if (existing) {
      // Jika pakai --reset, hapus lalu buat ulang
      if (process.argv.includes("--reset")) {
        await User.deleteOne({ email: SUPER_ADMIN.email });
        console.log("🗑️  Existing SuperAdmin account deleted.");
      } else {
        console.log("⚠️  SuperAdmin already exists, skipping.");
        console.log(`   Email : ${existing.email}`);
        console.log(`   Role  : ${existing.role}`);
        console.log("\n   Gunakan flag --reset untuk menghapus dan membuat ulang.");
        await mongoose.disconnect();
        return;
      }
    }

    // User.create() akan memicu pre-save hook → password di-hash otomatis
    const admin = await User.create(SUPER_ADMIN);

    console.log("\n🎉 SuperAdmin account created successfully!");
    console.log("─".repeat(40));
    console.log(`   Name     : ${admin.name}`);
    console.log(`   Email    : ${SUPER_ADMIN.email}`);
    console.log(`   Password : ${SUPER_ADMIN.password}  ← simpan baik-baik!`);
    console.log(`   Role     : ${admin.role}`);
    console.log(`   Plan     : ${admin.plan}`);
    console.log("─".repeat(40));
    console.log("\n⚠️  Segera ganti password setelah login pertama kali!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder gagal:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedSuperAdmin();
