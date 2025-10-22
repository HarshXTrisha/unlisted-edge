# Unlisted Edge - Trading Platform

A full-stack trading platform for unlisted shares with AI-powered insights.

## 🚀 Features

- **Pre-IPO Trading**: Access to unlisted company shares
- **Order Management**: Buy/Sell orders with matching engine
- **Portfolio Tracking**: Real-time portfolio management
- **Wallet System**: Secure fund management
- **AI Insights**: Company analysis and recommendations
- **Real-time Updates**: Live price feeds and notifications

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Knex.js** - Query builder
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL 12 or higher
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd unlisted-trading-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials and other settings.

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb unlisted_trading
   
   # Run migrations
   npm run migrate
   ```

5. **Start the development servers**
   
   **Frontend (Next.js):**
   ```bash
   npm run dev
   ```
   
   **Backend (Express):**
   ```bash
   npm run server:dev
   ```

## 📁 Project Structure

```
unlisted-trading-platform/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages
│   └── components/        # React components
├── server/                # Express.js backend
│   ├── config/           # Database configuration
│   ├── migrations/       # Database migrations
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
├── public/               # Static assets
└── package.json          # Dependencies
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **companies** - Unlisted company information
- **orders** - Buy/sell orders
- **trades** - Executed transactions
- **portfolios** - User holdings

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/unlisted_trading
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unlisted_trading
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
```

## 📜 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run server` - Start Express server
- `npm run server:dev` - Start Express server with nodemon
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback migrations
- `npm run build` - Build for production
- `npm start` - Start production server

## 🚦 Getting Started

1. Make sure PostgreSQL is running
2. Run migrations: `npm run migrate`
3. Start backend: `npm run server:dev`
4. Start frontend: `npm run dev`
5. Visit `http://localhost:3000`

## 🔧 Development

### Adding New Features
1. Create database migrations in `server/migrations/`
2. Add API routes in `server/routes/`
3. Create frontend components in `src/components/`
4. Add pages in `src/app/`

### Database Operations
```bash
# Create new migration
npx knex migrate:make migration_name --knexfile server/knexfile.js

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.