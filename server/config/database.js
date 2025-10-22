const knex = require('knex');
const dotenv = require('dotenv');

dotenv.config();

const db = knex({
    client: 'postgresql',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || (() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Using default password for development. Set DB_PASSWORD in production!');
        return 'password';
      }
      throw new Error('DB_PASSWORD environment variable is required in production');
    })(),
        database: process.env.DB_NAME || 'unlisted_trading'
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: '../migrations'
    }
});

// Test database connection
db.raw('SELECT 1')
    .then(() => {
        console.log('✅ Database connected successfully');
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = db;