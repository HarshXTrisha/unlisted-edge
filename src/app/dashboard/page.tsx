'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoUser } from '@/utils/demoUser';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Load demo user
    const demoUser = getDemoUser();
    setUser(demoUser);
    setWalletBalance(demoUser.wallet_balance);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-white">Unlisted Edge</h1>
            <nav className="flex items-center space-x-6">
              <span className="text-white/70">Welcome, {user.first_name}!</span>
              <a
                href="/"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Welcome to Your Dashboard
          </h2>
          <p className="text-xl text-blue-200">
            Start trading unlisted shares and build your portfolio
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">₹{walletBalance.toLocaleString()}</div>
            <div className="text-sm text-green-200">Wallet Balance</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">₹0</div>
            <div className="text-sm text-blue-200">Portfolio Value</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-sm text-purple-200">Active Orders</div>
          </div>
          <div className="bg-orange-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-sm text-orange-200">Holdings</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-3">🏢 Browse Companies</h3>
            <p className="text-blue-200 mb-4">Explore 10 unlisted companies ready for trading</p>
            <a href="/companies" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-block transition-colors">
              View Companies
            </a>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-3">💼 My Portfolio</h3>
            <p className="text-blue-200 mb-4">Track your investments and performance</p>
            <a href="/portfolio" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg inline-block transition-colors">
              View Portfolio
            </a>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-3">📋 Order History</h3>
            <p className="text-blue-200 mb-4">Track all your trading orders and status</p>
            <a href="/orders" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-block transition-colors">
              View Orders
            </a>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-3">💰 Manage Wallet</h3>
            <p className="text-blue-200 mb-4">Add funds or withdraw your earnings</p>
            <a href="/wallet" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-block transition-colors">
              Manage Wallet
            </a>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <p className="text-white/70">No recent activity</p>
            <p className="text-white/50 text-sm mt-2">Start trading to see your activity here</p>
          </div>
        </div>
      </main>
    </div>
  );
}