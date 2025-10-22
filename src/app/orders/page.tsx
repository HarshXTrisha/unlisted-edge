'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: number;
  company_name: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price: string;
  total_amount: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  filled_quantity: number;
  filled_amount: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // For demo, show sample orders
      const sampleOrders: Order[] = [
        {
          id: 1,
          company_name: "BYJU'S - Think and Learn",
          symbol: "BYJU",
          type: "BUY",
          order_type: "MARKET",
          quantity: 10,
          price: "850.00",
          total_amount: "8500.00",
          status: "COMPLETED",
          filled_quantity: 10,
          filled_amount: "8500.00",
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 2,
          company_name: "Dream11 Fantasy Sports",
          symbol: "DREAM11",
          type: "BUY",
          order_type: "LIMIT",
          quantity: 5,
          price: "1200.00",
          total_amount: "6000.00",
          status: "PENDING",
          filled_quantity: 0,
          filled_amount: "0.00",
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          company_name: "Razorpay Software",
          symbol: "RAZORPAY",
          type: "BUY",
          order_type: "MARKET",
          quantity: 2,
          price: "2500.00",
          total_amount: "5000.00",
          status: "CANCELLED",
          filled_quantity: 0,
          filled_amount: "0.00",
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setOrders(sampleOrders);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch orders');
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true;
    return order.status === filter;
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${value.toLocaleString()}`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 bg-green-500/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-500/20';
      case 'PARTIAL': return 'text-blue-400 bg-blue-500/20';
      case 'CANCELLED': return 'text-red-400 bg-red-500/20';
      default: return 'text-white bg-white/20';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading orders...</div>
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
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Order History
          </h1>
          <p className="text-xl text-blue-200">
            Track all your trading orders and their status
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-8 justify-center">
          {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  {/* Company Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-white">{order.symbol}</h3>
                    <p className="text-blue-200 text-sm">{order.company_name}</p>
                    <p className="text-white/50 text-xs">{formatDate(order.created_at)}</p>
                  </div>

                  {/* Order Details */}
                  <div className="text-center">
                    <div className={`font-bold text-lg ${getTypeColor(order.type)}`}>
                      {order.type}
                    </div>
                    <div className="text-white/70 text-sm">{order.order_type}</div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="text-center">
                    <div className="text-white font-semibold">{order.quantity}</div>
                    <div className="text-white/70 text-sm">shares</div>
                    <div className="text-white/50 text-xs">@ {formatCurrency(order.price)}</div>
                  </div>

                  {/* Amount */}
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(order.total_amount)}</div>
                    <div className="text-white/70 text-sm">Total</div>
                    {order.filled_quantity > 0 && (
                      <div className="text-green-400 text-xs">
                        Filled: {order.filled_quantity}/{order.quantity}
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.status === 'PENDING' && (
                      <button className="block mt-2 mx-auto bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">
                {filter === 'ALL' ? 'No Orders Yet' : `No ${filter} Orders`}
              </h3>
              <p className="text-white/70 mb-6">
                {filter === 'ALL' 
                  ? 'Start trading to see your order history here'
                  : `You don't have any ${filter.toLowerCase()} orders`
                }
              </p>
              <Link
                href="/companies"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Browse Companies
              </Link>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{orders.length}</div>
              <div className="text-sm text-white/70">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {orders.filter(o => o.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-green-200">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {orders.filter(o => o.status === 'PENDING').length}
              </div>
              <div className="text-sm text-yellow-200">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0))}
              </div>
              <div className="text-sm text-white/70">Total Value</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}