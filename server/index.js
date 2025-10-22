const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { initializeSupabaseTables } = require('./config/supabase');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase tables for analytics cache
initializeSupabaseTables().catch(err => {
  console.error('Supabase initialization failed:', err.message);
  console.log('⚠️  Continuing without analytics cache...');
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS configuration
const getCorsOptions = () => {
  const baseOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  // In production, use strict origin list from environment
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : baseOrigins;
    
    return {
      origin: allowedOrigins,
      credentials: true,
      optionsSuccessStatus: 200
    };
  }

  // In development, allow local network IPs
  return {
    origin: [
      ...baseOrigins,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/
    ],
    credentials: true,
    optionsSuccessStatus: 200
  };
};

const corsOptions = getCorsOptions();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Unlisted Trading Platform API is running' });
});

// Import and use route modules
const { router: authRouter } = require('./routes/auth');
const companiesRouter = require('./routes/companies');
const ordersRouter = require('./routes/orders');
const portfolioRouter = require('./routes/portfolio');
const walletRouter = require('./routes/wallet');
const adminRouter = require('./routes/admin');
const { router: simpleKycRouter } = require('./routes/simple-kyc');

app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/admin', adminRouter);
app.use('/api/kyc', simpleKycRouter);

// Configurable host binding
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏠 Local access: http://localhost:${PORT}`);
  
  if (HOST === '0.0.0.0') {
    console.log(`📡 Network access available on all interfaces`);
  } else {
    console.log(`📡 Bound to: http://${HOST}:${PORT}`);
  }
});