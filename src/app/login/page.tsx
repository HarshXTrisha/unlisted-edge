'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginDemoUser } from '@/utils/demoUser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = loginDemoUser(email, password);
      if (user) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts - passwords are managed securely in backend
  // For development: Check README.md for demo credentials
  const demoAccounts = [
    { email: 'demo@unlistededge.com', role: 'Verified Investor' },
    { email: 'john@example.com', role: 'Regular User' },
    { email: 'admin@platform.com', role: 'Admin' }
  ];

  const fillDemoCredentials = (email: string) => {
    setEmail(email);
    // User needs to enter password manually for security
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to Unlisted Edge
          </h2>
          <p className="mt-2 text-center text-sm text-blue-200">
            Access your trading dashboard
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-gray-400 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-gray-400 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoCredentials(account.email)}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-md border border-white/20 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white text-sm font-medium">{account.email}</div>
                      <div className="text-blue-200 text-xs">{account.role}</div>
                      <div className="text-white/50 text-xs mt-1">Check README for password</div>
                    </div>
                    <div className="text-white/50 text-xs">Click to fill email</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-300 hover:text-blue-200 text-sm"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}