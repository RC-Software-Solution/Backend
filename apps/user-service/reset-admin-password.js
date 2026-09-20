#!/usr/bin/env node
/**
 * Recovery script to create/reset an admin user with a known password
 * Usage: node reset-admin-password.js [email] [password]
 * Example: node reset-admin-password.js admin@test.com password123
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
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

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        full_name: 'Admin User',
        email,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        approved: true,
      },
    });

    if (!created) {
      await user.update({ password: hashedPassword });
      console.log('✓ Existing user password updated');
    } else {
      console.log('✓ New admin user created');
    }

    console.log('\n' + '='.repeat(50));
    console.log('Login Credentials:');
    console.log('='.repeat(50));
    console.log(`Email:    ${email}`);
    console.log(`Password: ${plainPassword}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
