'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Company {
  id: number;
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  current_price: string;
  market_cap: string;
  total_shares: number;
  available_shares: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/companies');
      const data = await response.json();
      
      if (response.ok) {
        setCompanies(data.companies);
      } else {
        setError('Failed to fetch companies');
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString()}`;
  };

  const formatMarketCap = (amount: string) => {
    const value = parseFloat(amount);
    if (value >= 10000000000) {
      return `₹${(value / 10000000000).toFixed(1)}K Cr`;
    } else if (value >= 100000000) {
      return `₹${(value / 100000000).toFixed(1)} Cr`;
    }
    return `₹${(value / 100000000).toFixed(2)} Cr`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl md:text-2xl font-bold text-white">
              Unlisted Edge
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-white/70 hover:text-white">Dashboard</Link>
              <Link href="/portfolio" className="text-white/70 hover:text-white">Portfolio</Link>
              <Link href="/wallet" className="text-white/70 hover:text-white">Wallet</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Unlisted Companies
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            Discover and invest in pre-IPO companies
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search companies, symbols, or sectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-200"
            >
              {/* Company Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{company.symbol}</h3>
                  <p className="text-blue-200 text-sm">{company.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(company.current_price)}
                  </div>
                  <div className="text-xs text-white/50">per share</div>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Sector:</span>
                  <span className="text-white">{company.sector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Industry:</span>
                  <span className="text-white text-sm">{company.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Market Cap:</span>
                  <span className="text-white">{formatMarketCap(company.market_cap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Available:</span>
                  <span className="text-white">{company.available_shares.toLocaleString()} shares</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/80 text-sm mb-4 line-clamp-2">
                {company.description}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/companies/${company.id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/trade/${company.id}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  Trade Now
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">No companies found matching your search.</p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Market Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{companies.length}</div>
              <div className="text-sm text-white/70">Total Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {companies.reduce((acc, c) => acc + c.available_shares, 0).toLocaleString()}
              </div>
              <div className="text-sm text-white/70">Available Shares</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {new Set(companies.map(c => c.sector)).size}
              </div>
              <div className="text-sm text-white/70">Sectors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ₹{Math.round(companies.reduce((acc, c) => acc + parseFloat(c.current_price), 0) / companies.length)}
              </div>
              <div className="text-sm text-white/70">Avg. Price</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}