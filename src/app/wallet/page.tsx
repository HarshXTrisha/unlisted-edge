'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { depositFunds, withdrawFunds } from '@/utils/api';
import { getDemoUser, updateDemoUser } from '@/utils/demoUser';

interface Transaction {
  id: number;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW';
  company_name?: string;
  symbol?: string;
  amount: number;
  quantity?: number;
  price?: number;
  created_at: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    fetchWalletData();
    // Load demo user balance
    const user = getDemoUser();
    setBalance(user.wallet_balance);
  }, []);

  const fetchWalletData = async () => {
    try {
      // Sample transaction data for demo
      const sampleTransactions: Transaction[] = [
        {
          id: 1,
          type: 'DEPOSIT',
          amount: 10000,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          type: 'BUY',
          company_name: "BYJU'S - Think and Learn",
          symbol: 'BYJU',
          amount: -8000,
          quantity: 10,
          price: 800,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          type: 'BUY',
          company_name: 'Dream11 Fantasy Sports',
          symbol: 'DREAM11',
          amount: -5750,
          quantity: 5,
          price: 1150,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setTransactions(sampleTransactions);
    } catch (err) {
      setError('Failed to fetch wallet data');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0 || amount > 100000) {
        setError('Please enter a valid amount between ₹1 and ₹1,00,000');
        setLoading(false);
        return;
      }

      // Call real API
      const result = await depositFunds(amount);
      
      if (result.success) {
        // Update local balance
        const user = getDemoUser();
        user.wallet_balance += amount;
        updateDemoUser(user);
        setBalance(user.wallet_balance);
        
        setTransactions(prev => [{
          id: Date.now(),
          type: 'DEPOSIT',
          amount: amount,
          created_at: new Date().toISOString()
        }, ...prev]);

        setDepositAmount('');
        setShowDeposit(false);
      } else {
        setError(result.error || 'Deposit failed. Please try again.');
      }
    } catch (err) {
      setError('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(withdrawAmount);
      if (amount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (amount > balance) {
        setError('Insufficient balance');
        setLoading(false);
        return;
      }

      // Call real API
      const result = await withdrawFunds(amount);
      
      if (result.success) {
        // Update local balance
        const user = getDemoUser();
        user.wallet_balance -= amount;
        updateDemoUser(user);
        setBalance(user.wallet_balance);
        
        setTransactions(prev => [{
          id: Date.now(),
          type: 'WITHDRAW',
          amount: -amount,
          created_at: new Date().toISOString()
        }, ...prev]);

        setWithdrawAmount('');
        setShowWithdraw(false);
      } else {
        setError(result.error || 'Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setError('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString()}`;
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return '💰';
      case 'WITHDRAW': return '🏦';
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      default: return '💳';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-green-400';
      case 'WITHDRAW': return 'text-red-400';
      case 'BUY': return 'text-blue-400';
      case 'SELL': return 'text-purple-400';
      default: return 'text-white';
    }
  };

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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            My Wallet
          </h1>
          <p className="text-xl text-blue-200">
            Manage your funds and track transactions
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Wallet Balance */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Available Balance</h2>
            <div className="text-5xl font-bold text-green-400 mb-6">
              {formatCurrency(balance)}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowDeposit(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                💰 Add Money
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🏦 Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Add Money to Wallet</h3>
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-white mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="1"
                    max="100000"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter amount"
                  />
                  <p className="text-white/50 text-sm mt-1">Minimum: ₹1, Maximum: ₹1,00,000</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Processing...' : 'Add Money'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeposit(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Withdraw Money</h3>
              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-white mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="1"
                    max={balance}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                  <p className="text-white/50 text-sm mt-1">Available: {formatCurrency(balance)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Processing...' : 'Withdraw'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
          
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                    <div>
                      <div className="text-white font-semibold">
                        {transaction.type}
                        {transaction.company_name && ` - ${transaction.symbol}`}
                      </div>
                      <div className="text-white/50 text-sm">
                        {formatDate(transaction.created_at)}
                      </div>
                      {transaction.quantity && (
                        <div className="text-white/70 text-sm">
                          {transaction.quantity} shares @ {formatCurrency(transaction.price || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`text-right ${getTransactionColor(transaction.type)}`}>
                    <div className="font-bold text-lg">
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/70">No transactions yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}