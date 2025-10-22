'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { placeOrder } from '@/utils/api';
import { getDemoUser, updateDemoUser } from '@/utils/demoUser';

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
}

export default function TradePage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchCompany(params.id as string);
    }
    // Load demo user wallet balance
    const user = getDemoUser();
    setWalletBalance(user.wallet_balance);
  }, [params.id]);

  const fetchCompany = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCompany(data.company);
        setPrice(data.company.current_price);
      } else {
        setError('Company not found');
      }
    } catch (err) {
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const orderQuantity = parseInt(quantity);
      const orderPrice = parseFloat(price);

      if (orderQuantity <= 0) {
        setError('Please enter a valid quantity');
        setSubmitting(false);
        return;
      }

      if (orderMode === 'LIMIT' && orderPrice <= 0) {
        setError('Please enter a valid price');
        setSubmitting(false);
        return;
      }

      const totalAmount = orderPrice * orderQuantity;

      if (orderType === 'BUY' && totalAmount > walletBalance) {
        setError('Insufficient wallet balance');
        setSubmitting(false);
        return;
      }

      if (company && orderQuantity > company.available_shares) {
        setError('Not enough shares available');
        setSubmitting(false);
        return;
      }

      // Place actual order via API
      const result = await placeOrder({
        company_id: company!.id,
        type: orderType,
        order_type: orderMode,
        quantity: orderQuantity,
        price: orderMode === 'LIMIT' ? orderPrice : undefined
      });

      if (result.success) {
        setSuccess(`${orderType} order placed successfully! ${orderQuantity} shares of ${company?.symbol} at ₹${orderPrice}`);
        
        // Update local wallet balance for demo
        if (orderType === 'BUY') {
          const user = getDemoUser();
          user.wallet_balance -= totalAmount;
          updateDemoUser(user);
          setWalletBalance(user.wallet_balance);
        }

        // Clear form
        setQuantity('');
        setPrice(company?.current_price || '');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/portfolio');
        }, 3000);
      } else {
        setError(result.error || 'Failed to place order');
      }

    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${value.toLocaleString()}`;
  };

  const calculateTotal = () => {
    const qty = parseInt(quantity) || 0;
    const prc = parseFloat(price) || 0;
    return qty * prc;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading company data...</div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
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
        {company && (
          <>
            {/* Company Header */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{company.symbol}</h1>
                  <p className="text-blue-200 text-lg mb-2">{company.name}</p>
                  <p className="text-white/70">{company.sector} • {company.industry}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    {formatCurrency(company.current_price)}
                  </div>
                  <div className="text-white/50">per share</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Trading Form */}
              <div className="lg:col-span-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Place Order</h2>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-6">
                      <p className="text-green-200 text-sm">{success}</p>
                      <p className="text-green-300 text-xs mt-1">Redirecting to portfolio...</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmitOrder} className="space-y-6">
                    {/* Order Type */}
                    <div>
                      <label className="block text-white font-medium mb-3">Order Type</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setOrderType('BUY')}
                          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                            orderType === 'BUY'
                              ? 'bg-green-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          BUY
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('SELL')}
                          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                            orderType === 'SELL'
                              ? 'bg-red-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          SELL
                        </button>
                      </div>
                    </div>

                    {/* Order Mode */}
                    <div>
                      <label className="block text-white font-medium mb-3">Order Mode</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderMode('MARKET');
                            setPrice(company.current_price);
                          }}
                          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                            orderMode === 'MARKET'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          MARKET
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderMode('LIMIT')}
                          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                            orderMode === 'LIMIT'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          LIMIT
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-white font-medium mb-2">Quantity</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        max={company.available_shares}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter number of shares"
                      />
                      <p className="text-white/50 text-sm mt-1">
                        Available: {company.available_shares.toLocaleString()} shares
                      </p>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Price per Share {orderMode === 'MARKET' && '(Market Price)'}
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                        disabled={orderMode === 'MARKET'}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Enter price per share"
                      />
                    </div>

                    {/* Order Summary */}
                    {quantity && price && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/70">Quantity:</span>
                            <span className="text-white">{quantity} shares</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Price per share:</span>
                            <span className="text-white">{formatCurrency(price)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-lg border-t border-white/20 pt-2">
                            <span className="text-white">Total Amount:</span>
                            <span className={orderType === 'BUY' ? 'text-red-400' : 'text-green-400'}>
                              {orderType === 'BUY' ? '-' : '+'}{formatCurrency(calculateTotal())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting || !quantity || !price}
                      className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors ${
                        orderType === 'BUY'
                          ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800'
                          : 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
                      } text-white disabled:opacity-50`}
                    >
                      {submitting ? 'Placing Order...' : `${orderType} ${quantity || 0} Shares`}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Wallet Info */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">Wallet Balance</h3>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(walletBalance)}
                  </div>
                  <Link
                    href="/wallet"
                    className="inline-block mt-3 text-blue-300 hover:text-blue-200 text-sm"
                  >
                    Manage Wallet →
                  </Link>
                </div>

                {/* Company Stats */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">Company Stats</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Market Cap:</span>
                      <span className="text-white">
                        ₹{(parseFloat(company.market_cap) / 100000000).toFixed(1)} Cr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Shares:</span>
                      <span className="text-white">{company.total_shares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Available:</span>
                      <span className="text-white">{company.available_shares.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href={`/companies/${company.id}`}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                    >
                      Company Details
                    </Link>
                    <Link
                      href="/portfolio"
                      className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                    >
                      View Portfolio
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}