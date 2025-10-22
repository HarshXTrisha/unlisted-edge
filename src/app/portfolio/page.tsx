'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPortfolio } from '@/utils/api';

interface PortfolioHolding {
  id: number;
  company_name: string;
  symbol: string;
  quantity: number;
  average_price: string;
  current_price: string;
  total_invested: string;
  current_value: number;
  gain_loss: number;
  gain_loss_percentage: number;
  sector: string;
}

interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_gain_loss: number;
  total_gain_loss_percentage: number;
  holdings_count: number;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const result = await getPortfolio();
      
      if (result.success && result.data) {
        setPortfolio(result.data.portfolio || []);
        setSummary(result.data.summary || null);
      } else {
        // Show empty portfolio if no data
        setPortfolio([]);
        setSummary({
          total_invested: 0,
          current_value: 0,
          total_gain_loss: 0,
          total_gain_loss_percentage: 0,
          holdings_count: 0
        });
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading portfolio...</div>
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
            My Portfolio
          </h1>
          <p className="text-xl text-blue-200">
            Track your investments and performance
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Portfolio Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-500/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white">{formatCurrency(summary.total_invested)}</div>
              <div className="text-sm text-blue-200">Total Invested</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white">{formatCurrency(summary.current_value)}</div>
              <div className="text-sm text-green-200">Current Value</div>
            </div>
            <div className={`rounded-lg p-6 text-center ${summary.total_gain_loss >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`text-3xl font-bold ${summary.total_gain_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.total_gain_loss >= 0 ? '+' : ''}{formatCurrency(summary.total_gain_loss)}
              </div>
              <div className={`text-sm ${summary.total_gain_loss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                Total P&L ({summary.total_gain_loss_percentage >= 0 ? '+' : ''}{summary.total_gain_loss_percentage.toFixed(2)}%)
              </div>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white">{summary.holdings_count}</div>
              <div className="text-sm text-purple-200">Holdings</div>
            </div>
          </div>
        )}

        {/* Holdings */}
        {portfolio.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Your Holdings</h2>
            {portfolio.map((holding) => (
              <div
                key={holding.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  {/* Company Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-white">{holding.symbol}</h3>
                    <p className="text-blue-200 text-sm">{holding.company_name}</p>
                    <p className="text-white/50 text-xs">{holding.sector}</p>
                  </div>

                  {/* Quantity & Avg Price */}
                  <div className="text-center">
                    <div className="text-white font-semibold">{holding.quantity}</div>
                    <div className="text-white/70 text-sm">Shares</div>
                    <div className="text-white/50 text-xs">Avg: {formatCurrency(holding.average_price)}</div>
                  </div>

                  {/* Current Price */}
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(holding.current_price)}</div>
                    <div className="text-white/70 text-sm">Current Price</div>
                  </div>

                  {/* Investment */}
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(holding.total_invested)}</div>
                    <div className="text-white/70 text-sm">Invested</div>
                    <div className="text-white font-semibold">{formatCurrency(holding.current_value)}</div>
                    <div className="text-white/70 text-sm">Current</div>
                  </div>

                  {/* P&L */}
                  <div className="text-center">
                    <div className={`font-bold ${holding.gain_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.gain_loss >= 0 ? '+' : ''}{formatCurrency(holding.gain_loss)}
                    </div>
                    <div className={`text-sm ${holding.gain_loss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                      {holding.gain_loss_percentage >= 0 ? '+' : ''}{holding.gain_loss_percentage.toFixed(2)}%
                    </div>
                    <Link
                      href={`/trade/${holding.id}`}
                      className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors"
                    >
                      Trade
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">No Holdings Yet</h3>
              <p className="text-white/70 mb-6">Start building your portfolio by investing in unlisted companies</p>
              <Link
                href="/companies"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Browse Companies
              </Link>
            </div>
          </div>
        )}

        {/* Performance Chart Placeholder */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Performance Chart</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
            <p className="text-white/50">Chart coming soon - Portfolio performance over time</p>
          </div>
        </div>
      </main>
    </div>
  );
}