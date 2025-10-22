const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Only run in development environment
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping admin user seed in production environment');
    return;
  }

  // Get admin credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@platform.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Require secure password in production
  let finalAdminPassword = adminPassword;
  if (!finalAdminPassword) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ ADMIN_PASSWORD environment variable is required in production');
      process.exit(1);
    }
    // Generate secure random password for development
    const crypto = require('crypto');
    finalAdminPassword = crypto.randomBytes(16).toString('hex');
    console.log('⚠️  Generated admin password for development:', finalAdminPassword);
  }
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'User';
  
  // Check if admin user already exists
  const existingAdmin = await knex('users').where({ email: adminEmail }).first();
  
  if (!existingAdmin) {
    // Create admin user with hashed password
    const hashedPassword = await bcrypt.hash(finalAdminPassword, 12);
    
    // Insert without hardcoded ID - let database auto-generate
    const [adminUser] = await knex('users').insert([
      {
        email: adminEmail,
        password: hashedPassword,
        first_name: adminFirstName,
        last_name: adminLastName,
        phone: '+91-9999999998', // Admin phone
        is_verified: true,
        is_active: true,
        wallet_balance: 0.00,
        user_role: 'admin'
      }
    ]).returning('*');
    
    console.log(`Admin user created with email: ${adminEmail}`);
    console.log('SECURITY: Admin must change password on first login');
    
    // Don't log password in production-like environments
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode - Admin credentials available in environment variables');
    }
  } else {
    console.log('Admin user already exists, skipping creation');
  }
};