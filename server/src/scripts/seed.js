import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import { sampleBooks } from '../data/sampleBooks.js';

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME?.trim() || 'BookNest Admin';

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'Please set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running the seed script.'
      );
    }

    if (adminPassword.length < 6) {
      throw new Error('ADMIN_PASSWORD must be at least 6 characters long.');
    }

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`Created initial admin account: ${adminUser.email}`);
    } else {
      console.log(`Admin account already exists: ${adminUser.email}`);
    }

    const existingCount = await Book.countDocuments();
    const forceBooks = process.argv.includes('--force-books');

    if (existingCount === 0 || forceBooks) {
      if (forceBooks) {
        await Book.deleteMany({});
      }
      await Book.insertMany(sampleBooks);
      console.log(`Seeded ${sampleBooks.length} sample books.`);
    } else {
      console.log(`Books collection already has ${existingCount} books. Skipping book seed.`);
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
