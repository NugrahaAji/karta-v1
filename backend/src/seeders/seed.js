import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Dimension from "../models/dimension.model.js";
import dimensionSeedData from "./dimension.seeder.js";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "Karta";

const SUPER_ADMIN = {
  name: "Super Admin",
  email: "superadmin@karta.dev",
  password: "SuperAdmin123!",
  role: "superAdmin",
  accountRole: "superAdmin",
  isVerified: true,
  isActive: true,
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log("✅ Connected to MongoDB");

    // ── Seed SuperAdmin ─────────────────────────────────────────────────
    // const existingAdmin = await User.findOne({ email: SUPER_ADMIN.email });
    // if (existingAdmin) {
    //   console.log("⚠️  SuperAdmin already exists, skipping...");
    // } else {
    //   await User.create(SUPER_ADMIN);
    //   console.log("✅ SuperAdmin account created");
    //   console.log(`   Email: ${SUPER_ADMIN.email}`);
    //   console.log(`   Password: ${SUPER_ADMIN.password}`);
    // }

    // ── Seed Dimensions ─────────────────────────────────────────────────
    const existingCount = await Dimension.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} dimensions already exist. Drop and re-seed? (use --force flag)`);
      if (process.argv.includes("--force")) {
        await Dimension.deleteMany({});
        console.log("🗑️  Cleared existing dimensions");
      } else {
        console.log("   Skipping dimension seeding. Use --force to overwrite.");
        await mongoose.disconnect();
        return;
      }
    }

    const inserted = await Dimension.insertMany(dimensionSeedData);
    console.log(`✅ Seeded ${inserted.length} dimensions:`);
    inserted.forEach((d) => {
      const subCount = d.subdimensions.length;
      const levelCount = d.subdimensions.reduce((acc, s) => acc + s.levels.length, 0);
      console.log(`   - ${d.name} (${subCount} subdimensions, ${levelCount} levels)`);
    });

    await mongoose.disconnect();
    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seed();
