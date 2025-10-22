# 🚀 Unlisted Trading Platform

A comprehensive trading platform for unlisted securities with integrated KYC (Know Your Customer) verification system.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-green)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com/)

## ✨ Features

### 🏦 **Core Trading Platform**
- **Company Listings** - Browse and discover unlisted companies
- **Trading Interface** - Buy/sell unlisted securities with real-time pricing
- **Portfolio Management** - Track investments and performance
- **Wallet System** - Secure fund management and transactions
- **Order Management** - Market and limit orders with order history

### 🔐 **KYC Verification System**
- **Document Upload** - Multi-file upload with validation (Aadhaar, PAN, Bank Statements)
- **Admin Review Panel** - Complete workflow for document verification
- **Real-time Status Tracking** - Users can monitor KYC progress
- **Trading Restrictions** - Automatic trading blocks until KYC verified
- **Audit Trail** - Comprehensive logging of all KYC actions

### 🛡️ **Security & Compliance**
- **Rate Limiting** - Prevents abuse with configurable limits
- **Audit Logging** - Complete action tracking with IP/timestamp
- **Document Expiry Management** - Automatic notifications and status updates
- **Role-based Access Control** - Secure admin-only operations
- **File Upload Security** - Size limits, format validation, secure storage

### 🎨 **User Experience**
- **Responsive Design** - Mobile-friendly interfaces
- **Real-time Updates** - Live status changes and notifications
- **Redux State Management** - Centralized application state
- **Error Handling** - Graceful error management and user feedback
- **Progressive Web App** - Fast, app-like experience

## 🏗️ Tech Stack

### **Frontend**
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Redux Toolkit** - State management
- **React Hook Form** - Form handling

### **Backend**
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Supabase** - Real-time features and analytics
- **Knex.js** - SQL query builder
- **JWT** - Authentication

### **Infrastructure**
- **Vercel** - Deployment and hosting
- **Supabase** - Database and real-time features
- **File Storage** - Secure document storage
- **Rate Limiting** - Express rate limiter

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/unlisted-trading-platform.git
cd unlisted-trading-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Update .env with your configuration:
# - Database connection string
# - JWT secret
# - Supabase keys
# - Other required variables
```

### 4. Database Setup
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 5. Start Development Servers
```bash
# Start backend server (port 5000)
npm run server:dev

# Start frontend server (port 3000)
npm run dev

# Or start both together
npm run dev:full
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin
- **KYC System**: http://localhost:3000/kyc

## 📁 Project Structure

```
unlisted-trading-platform/
├── src/                          # Frontend source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/               # Admin panel
│   │   ├── kyc/                 # KYC verification
│   │   ├── trade/               # Trading interface
│   │   └── ...
│   ├── components/              # Reusable components
│   ├── store/                   # Redux store and slices
│   ├── utils/                   # Utility functions
│   └── config/                  # Configuration files
├── server/                      # Backend source code
│   ├── routes/                  # API routes
│   ├── middleware/              # Express middleware
│   ├── services/                # Business logic services
│   ├── migrations/              # Database migrations
│   ├── seeds/                   # Database seed files
│   └── tests/                   # Test files
├── public/                      # Static assets
├── docs/                        # Documentation
└── deployment/                  # Deployment configurations
```

## 🔧 Configuration

### Environment Variables
See `.env.example` for all required environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your_jwt_secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

3. **Configure Environment Variables**
- Go to Vercel Dashboard > Settings > Environment Variables
- Add all required environment variables from `.env.example`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- server/tests/kycRoutes.test.js

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - System architecture and design decisions
- **[KYC System Summary](./KYC_SYSTEM_SUMMARY.md)** - Complete KYC implementation details
- **[Deployment Guide](./DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Database configuration guide
- **[Security Guide](./SECURITY.md)** - Security best practices and features

## 🔐 Security Features

- **Authentication & Authorization** - JWT-based with role-based access control
- **Rate Limiting** - Configurable limits to prevent abuse
- **Input Validation** - Comprehensive validation on all inputs
- **File Upload Security** - Size limits, format validation, secure storage
- **CORS Protection** - Restricted origins for production
- **Audit Logging** - Complete action tracking for compliance
- **Data Encryption** - Sensitive data encryption at rest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🎯 Roadmap

- [ ] **Mobile App** - React Native mobile application
- [ ] **Advanced Analytics** - Enhanced trading analytics and insights
- [ ] **API Integration** - Third-party financial data integration
- [ ] **Blockchain Integration** - Cryptocurrency trading support
- [ ] **Advanced KYC** - OCR and AI-powered document verification
- [ ] **Multi-language Support** - Internationalization

## 🏆 Key Metrics

- **🎯 100% Core Requirements Met**
- **🛡️ Enterprise-Grade Security**
- **📱 Mobile-Responsive Design**
- **⚡ High Performance & Scalability**
- **🔍 Complete Audit Trail**
- **🚀 Production Ready**

---

**Built with ❤️ for the unlisted securities trading community**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/unlisted-trading-platform)