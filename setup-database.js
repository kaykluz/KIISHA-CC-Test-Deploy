#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in your environment variables');
    console.log('\n📝 Please create a .env file with:');
    console.log('DATABASE_URL=your-planetscale-connection-string');
    process.exit(1);
  }

  console.log('🔄 Connecting to PlanetScale...');

  try {
    // Test connection
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Successfully connected to PlanetScale!');

    // Get database info
    const [rows] = await connection.execute('SELECT DATABASE() as db');
    console.log(`📊 Connected to database: ${rows[0].db}`);

    // Check if tables exist
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);
    console.log(`📋 Current number of tables: ${tables[0].count}`);

    await connection.end();

    if (tables[0].count === 0) {
      console.log('\n⚠️  No tables found. You need to run migrations.');
      console.log('👉 Run: npm run db:push');
    } else {
      console.log('\n✅ Database is set up with tables!');
    }

    console.log('\n🎉 Your PlanetScale database is ready!');
    console.log('\n📝 Next steps:');
    console.log('1. Add this DATABASE_URL to Vercel environment variables');
    console.log('2. Run migrations if needed: npm run db:push');
    console.log('3. Redeploy your Vercel app');

  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.log('\n🔍 Common issues:');
    console.log('- Check your connection string is correct');
    console.log('- Make sure you copied the entire connection string');
    console.log('- Ensure the password was created for the main branch');
    console.log('- Check if PlanetScale database is in "Awake" state');
    process.exit(1);
  }
}

setupDatabase();