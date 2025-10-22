const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json());
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

app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/wallet', walletRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});