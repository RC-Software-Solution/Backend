#!/usr/bin/env node
/**
 * Recovery script using raw SQL to create/reset an admin user
 * Usage: node reset-admin-password-sql.js [email] [password]
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const sequelize = require('./src/config/database');
const { hashPassword } = require('./src/utils/password');
const crypto = require('crypto');

async function resetAdminPassword() {
  try {
    const email = process.argv[2] || 'admin@test.com';
    const plainPassword = process.argv[3] || crypto.randomBytes(8).toString('hex');

    console.log('📝 Email:', email);
    console.log('🔑 Password:', plainPassword);

    await sequelize.authenticate();
    console.log('✓ Database connected');

    const hashedPassword = await hashPassword(plainPassword);
    console.log('✓ Password hashed');

    // Use raw SQL to avoid schema mismatches
    const now = new Date();
    const query = `
      INSERT INTO users (id, full_name, email, password, role, status, approved, created_at, updated_at)
      VALUES (UUID(), 'Admin User', ?, ?, 'admin', 'active', 1, ?, ?)
      ON DUPLICATE KEY UPDATE
      password = ?,
      updated_at = ?
    `;

    await sequelize.query(query, {
      replacements: [email, hashedPassword, now, now, hashedPassword, now],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('✓ User created/updated');

    console.log('\n' + '='.repeat(50));
    console.log('Login Credentials:');
    console.log('='.repeat(50));
    console.log(`Email:    ${email}`);
    console.log(`Password: ${plainPassword}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.original) {
      console.error('DB Error:', error.original.message);
    }
    process.exit(1);
  }
}

resetAdminPassword();
