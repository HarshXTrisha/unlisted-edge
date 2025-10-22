'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DYNAMIC_API_BASE_URL, getDynamicApiUrl } from '@/config/api';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [platformStats, setPlatformStats] = useState({
    totalCompanies: 0,
    avgPrice: 0,
    sectors: 0,
    totalShares: 0
  });

  useEffect(() => {
    // Check if backend API is running
    const apiUrl = getDynamicApiUrl();
    fetch(`${apiUrl}/api/health`)
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(() => setApiStatus('Backend not running'));

    // Fetch platform statistics
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const apiBaseUrl = DYNAMIC_API_BASE_URL();
      const response = await fetch(`${apiBaseUrl}/companies`);
      const data = await response.json();
      
      if (response.ok && data.companies) {
        const companies = data.companies;
        const totalCompanies = companies.length;
        const avgPrice = companies.reduce((sum: number, company: any) => 
          sum + parseFloat(company.current_price), 0) / totalCompanies;
        const sectors = new Set(companies.map((company: any) => company.sector)).size;
        const totalShares = companies.reduce((sum: number, company: any) => 
          sum + company.available_shares, 0);

        setPlatformStats({
          totalCompanies,
          avgPrice: Math.round(avgPrice),
          sectors,
          totalShares
        });
      }
    } catch (error) {
      console.error('Failed to fetch platform stats');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold">Unlisted Edge</h1>
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/about" className="hover:text-blue-300 transition-colors">About</Link>
              <Link href="/news" className="hover:text-blue-300 transition-colors">News</Link>
              <Link href="/education" className="hover:text-blue-300 transition-colors">Education</Link>
              <Link href="/ai" className="hover:text-blue-300 transition-colors">AI Insights</Link>
              <Link href="/kyc" className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors">KYC</Link>
              <Link href="/login" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">Login</Link>
              <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Dashboard</Link>
            </nav>
            {/* Mobile/Tablet Menu Button */}
            <button className="md:hidden text-white p-2 touch-manipulation">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Trade Unlisted Shares
          </h2>
          <p className="text-lg md:text-xl text-blue-200 mb-6 md:mb-8 px-4">
            Access pre-IPO companies and exclusive investment opportunities
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block touch-manipulation mb-8">
            <p className="text-sm">API Status: <span className="font-semibold">{apiStatus}</span></p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/companies" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Browse Companies
            </a>
            <a href="/ai" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              AI Insights
            </a>
            <a href="/education" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Learn Trading
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 touch-manipulation">
            <h3 className="text-xl font-semibold mb-3">🚀 Pre-IPO Access</h3>
            <p className="text-blue-200">Get early access to promising startups before they go public</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 touch-manipulation">
            <h3 className="text-xl font-semibold mb-3">📊 AI Insights</h3>
            <p className="text-blue-200">Advanced AI analysis for better investment decisions</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 touch-manipulation">
            <h3 className="text-xl font-semibold mb-3">🔒 Secure Trading</h3>
            <p className="text-blue-200">Bank-grade security for all your transactions</p>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-green-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{platformStats.totalCompanies}</div>
            <div className="text-sm text-green-200">Listed Companies</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">₹{platformStats.avgPrice.toLocaleString()}</div>
            <div className="text-sm text-blue-200">Avg. Share Price</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{platformStats.sectors}</div>
            <div className="text-sm text-purple-200">Industry Sectors</div>
          </div>
          <div className="bg-orange-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{(platformStats.totalShares / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-orange-200">Available Shares</div>
          </div>
        </div>

        {/* Featured Companies */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Featured Companies</h3>
          <p className="text-blue-200">Top performing unlisted companies on our platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">BYJU</h4>
                <p className="text-blue-200 text-sm">Education Technology</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">₹850</div>
                <div className="text-xs text-white/50">per share</div>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">Leading EdTech platform with global presence</p>
            <Link href="/companies/1" className="text-blue-300 hover:text-blue-200 text-sm font-medium">
              View Details →
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">RAZORPAY</h4>
                <p className="text-blue-200 text-sm">Financial Services</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">₹2,500</div>
                <div className="text-xs text-white/50">per share</div>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">Leading fintech platform for digital payments</p>
            <Link href="/companies/5" className="text-blue-300 hover:text-blue-200 text-sm font-medium">
              View Details →
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">DREAM11</h4>
                <p className="text-blue-200 text-sm">Technology</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">₹1,200</div>
                <div className="text-xs text-white/50">per share</div>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">Fantasy sports platform with millions of users</p>
            <Link href="/companies/4" className="text-blue-300 hover:text-blue-200 text-sm font-medium">
              View Details →
            </Link>
          </div>
        </div>

        {/* Market Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Market Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Why Unlisted Shares?</h4>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Early access to high-growth companies
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Potential for significant returns
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Portfolio diversification opportunities
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Participate in India's startup ecosystem
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Platform Benefits</h4>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center">
                  <span className="text-blue-400 mr-3">•</span>
                  Verified companies with due diligence
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-3">•</span>
                  Real-time order matching system
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-3">•</span>
                  AI-powered investment insights
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-3">•</span>
                  Comprehensive educational resources
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}