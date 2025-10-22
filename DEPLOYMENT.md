# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Production Database**: Set up a PostgreSQL database (recommended: Supabase, Railway, or Neon)

## 📋 Step-by-Step Deployment

### 1. Prepare Your Database

#### Option A: Use Supabase (Recommended)
- Your Supabase is already configured
- Run the SQL from `supabase-setup.sql` in your Supabase SQL editor
- Your database URL will be: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

#### Option B: Use Railway/Neon
- Create a new PostgreSQL database
- Get your connection string
- Update `DATABASE_URL` in environment variables

### 2. Deploy to Vercel

#### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd unlisted-trading-platform
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: unlisted-trading-platform (or your preferred name)
# - Directory: ./
# - Override settings? No
```

#### Method 2: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure as follows:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `.next`

### 3. Configure Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### Required Variables:
```
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_jwt_secret_here
SUPABASE_URL=https://iqhfiimumllclyikxlmbg.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://iqhfiimumllclyikxlmbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ALLOWED_ORIGINS=https://your-app-name.vercel.app
ENCRYPTION_KEY=your_32_byte_hex_encryption_key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password
```

#### Optional Variables:
```
AI_SERVICE_ENABLED=false
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

### 4. Update API URLs

After deployment, update your frontend API calls to use the production URL:
- Replace `http://localhost:5000` with `https://your-app-name.vercel.app`

### 5. Test Your Deployment

1. **Frontend**: Visit `https://your-app-name.vercel.app`
2. **API Health**: Visit `https://your-app-name.vercel.app/api/health`
3. **KYC System**: Test at `https://your-app-name.vercel.app/kyc`
4. **Admin Panel**: Test at `https://your-app-name.vercel.app/admin`

## 🔧 Post-Deployment Configuration

### 1. Database Setup
```bash
# Run migrations (if not done automatically)
npm run migrate

# Seed initial data
npm run seed
```

### 2. Domain Configuration (Optional)
- Add custom domain in Vercel dashboard
- Update `ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_URL` accordingly

### 3. SSL Certificate
- Vercel automatically provides SSL certificates
- Your site will be available at `https://your-app-name.vercel.app`

## 🛡️ Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Secure admin password
- [ ] Production database with proper access controls
- [ ] CORS origins restricted to your domain
- [ ] Environment variables properly set
- [ ] Demo mode disabled in production

## 📊 Monitoring

### Vercel Analytics
- Enable in Vercel dashboard under **Analytics**
- Monitor performance and usage

### Error Tracking
- Consider integrating Sentry for error tracking
- Add to your Next.js configuration

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch:

1. **Push changes**: `git push origin main`
2. **Automatic build**: Vercel builds and deploys
3. **Live updates**: Changes go live automatically

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify environment variables are set

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Vercel
   - Ensure migrations have run

3. **API Errors**
   - Check function logs in Vercel dashboard
   - Verify environment variables
   - Test API endpoints individually

4. **CORS Issues**
   - Update `ALLOWED_ORIGINS` with your domain
   - Check frontend API URLs point to production

### Getting Help:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Test locally first: `npm run build && npm start`

## 🎉 Success!

Your Unlisted Trading Platform with KYC system is now live on Vercel!

**Key URLs:**
- **Website**: https://your-app-name.vercel.app
- **API**: https://your-app-name.vercel.app/api
- **Admin**: https://your-app-name.vercel.app/admin
- **KYC**: https://your-app-name.vercel.app/kyc