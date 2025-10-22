const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Check if demo user already exists
  const existingUser = await knex('users').where({ email: 'demo@unlistededge.com' }).first();
  
  if (!existingUser) {
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 12);
    
    await knex('users').insert([
      {
        id: 1,
        email: 'demo@unlistededge.com',
        password: hashedPassword,
        first_name: 'Demo',
        last_name: 'User',
        phone: '+91-9876543210',
        is_verified: true,
        is_active: true,
        wallet_balance: 50000.00
      }
    ]);
    
    console.log('Demo user created: demo@unlistededge.com / demo123');
  }
};