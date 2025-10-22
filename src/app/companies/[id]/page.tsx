'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  created_at: string;
}

interface RecentTrade {
  price: string;
  quantity: number;
  created_at: string;
}

interface CompanyStats {
  total_trades: number;
  total_volume: number;
  avg_price: string;
  min_price: string;
  max_price: string;
  latest_price: string;
  last_trade_time: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchCompanyDetails(params.id as string);
    }
  }, [params.id]);

  const fetchCompanyDetails = async (id: string) => {
    try {
      // Fetch company details
      const companyResponse = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
        signal: AbortSignal.timeout(10000),
      });
      const companyData = await companyResponse.json();
      
      if (companyResponse.ok) {
        setCompany(companyData.company);
        setRecentTrades(companyData.recent_trades || []);
      } else {
        setError('Company not found');
      }

      // Fetch company stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/companies/${id}/stats`, {
        signal: AbortSignal.timeout(10000),
      });
      const statsData = await statsResponse.json();
      
      if (statsResponse.ok) {
        setStats(statsData.stats);
      }

    } catch (err) {
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${value.toLocaleString()}`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading company details...</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'Company not found'}</div>
          <Link href="/companies" className="text-blue-300 hover:text-blue-200">
            ← Back to Companies
          </Link>
        </div>
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
              <Link href="/companies" className="text-white/70 hover:text-white">Companies</Link>
              <Link href="/portfolio" className="text-white/70 hover:text-white">Portfolio</Link>
              <Link href="/wallet" className="text-white/70 hover:text-white">Wallet</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/companies" className="text-blue-300 hover:text-blue-200">
            ← Back to Companies
          </Link>
        </div>

        {/* Company Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{company.symbol}</h1>
                  <h2 className="text-2xl text-blue-200 mb-4">{company.name}</h2>
                  <div className="flex gap-4 text-sm">
                    <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full">
                      {company.sector}
                    </span>
                    <span className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full">
                      {company.industry}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                {company.description}
              </p>

              <div className="flex gap-4">
                <Link
                  href={`/trade/${company.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Trade Now
                </Link>
                <button 
                  onClick={() => {
                    // TODO: Implement watchlist functionality
                    alert(`Added ${company.symbol} to watchlist! (Feature coming soon)`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Add to Watchlist
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {formatCurrency(company.current_price)}
                </div>
                <div className="text-white/50">Current Price</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Market Cap:</span>
                  <span className="text-white font-semibold">{formatMarketCap(company.market_cap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Total Shares:</span>
                  <span className="text-white font-semibold">{company.total_shares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Available:</span>
                  <span className="text-white font-semibold">{company.available_shares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Listed Since:</span>
                  <span className="text-white font-semibold">
                    {new Date(company.created_at).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trading Statistics */}
          {stats && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">Trading Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.total_trades || 0}</div>
                  <div className="text-sm text-white/70">Total Trades</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.total_volume || 0}</div>
                  <div className="text-sm text-white/70">Volume</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.avg_price ? formatCurrency(stats.avg_price) : 'N/A'}
                  </div>
                  <div className="text-sm text-white/70">Avg Price</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.max_price ? formatCurrency(stats.max_price) : 'N/A'}
                  </div>
                  <div className="text-sm text-white/70">High</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Trades */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6">Recent Trades</h3>
            {recentTrades.length > 0 ? (
              <div className="space-y-3">
                {recentTrades.map((trade, index) => (
                  <div key={`${trade.created_at}-${trade.price}-${trade.quantity}-${index}`} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-semibold">{formatCurrency(trade.price)}</div>
                      <div className="text-white/50 text-sm">{formatDate(trade.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">{trade.quantity} shares</div>
                      <div className="text-white/50 text-sm">
                        {formatCurrency(parseFloat(trade.price) * trade.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/70">No recent trades</p>
                <p className="text-white/50 text-sm mt-2">Be the first to trade this stock!</p>
              </div>
            )}
          </div>
        </div>

        {/* Price Chart Placeholder */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Price Chart</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
            <div className="text-center">
              <p className="text-white/50 mb-2">📈 Interactive price chart coming soon</p>
              <p className="text-white/30 text-sm">Historical price data and technical indicators</p>
            </div>
          </div>
        </div>

        {/* Company News Placeholder */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Latest News & Updates</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-white font-semibold mb-2">Company Update</h4>
              <p className="text-white/70 text-sm mb-2">
                Latest financial results and business developments will appear here.
              </p>
              <p className="text-white/50 text-xs">News integration coming soon</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}