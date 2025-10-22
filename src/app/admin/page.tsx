'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoUser } from '@/utils/demoUser';
import { api } from '@/utils/api';

interface DashboardStats {
  users: {
    total_users: number;
    regular_users: number;
    verified_investors: number;
    active_users: number;
    pending_kyc: number;
    approved_kyc: number;
  };
  trading: {
    total_trades: number;
    total_volume: number;
    active_companies: number;
    avg_trade_size: number;
  };
  orders: {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
  };
  wallets: {
    total_wallet_balance: number;
    avg_wallet_balance: number;
    funded_users: number;
  };
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_role: string;
  kyc_status: string;
  is_active: boolean;
  wallet_balance: number;
  created_at: string;
  last_login: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_users: number;
    per_page: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<UsersResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    kyc_status: 'all',
    page: 1
  });

  useEffect(() => {
    const user = getDemoUser();
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    loadDashboardStats();
  }, [router]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '20',
        search: filters.search,
        role: filters.role,
        kyc_status: filters.kyc_status
      });

      const response = await api.get(`/admin/users?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to load users:', error);
      setError(`Failed to load users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setStats(data);
      setError(''); // Clear any previous errors
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to load dashboard stats:', error);
      setError(`Failed to load dashboard statistics: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };



  const handleUserAction = async (userId: number, action: string) => {
    try {
      const response = await api.patch(`/admin/users/${userId}`, { action });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      loadUsers(); // Reload users after action
      setError(''); // Clear any previous errors
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to update user:', error);
      setError(`Failed to update user: ${errorMessage}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage users, monitor trading activity, and system analytics
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'users', name: 'User Management', icon: '👥' },
              { id: 'kyc', name: 'KYC Review', icon: '🔍' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.users.total_users}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div>Active: {stats.users.active_users}</div>
                  <div>Verified: {stats.users.verified_investors}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">💰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Trading Volume</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(stats.trading.total_volume || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div>Total Trades: {stats.trading.total_trades}</div>
                  <div>Avg Size: {formatCurrency(stats.trading.avg_trade_size || 0)}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📋</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.orders.total_orders}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div>Pending: {stats.orders.pending_orders}</div>
                  <div>Completed: {stats.orders.completed_orders}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🏦</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Wallet Balance</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(stats.wallets.total_wallet_balance || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div>Funded Users: {stats.wallets.funded_users}</div>
                  <div>Avg Balance: {formatCurrency(stats.wallets.avg_wallet_balance || 0)}</div>
                </div>
              </div>
            </div>

            {/* KYC Status Overview */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">KYC Status Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.users.pending_kyc}</div>
                  <div className="text-sm text-yellow-700">Pending KYC</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.users.approved_kyc}</div>
                  <div className="text-sm text-green-700">Approved KYC</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.users.verified_investors}</div>
                  <div className="text-sm text-blue-700">Verified Investors</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    placeholder="Search by email or name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Regular User</option>
                    <option value="verified_investor">Verified Investor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
                  <select
                    value={filters.kyc_status}
                    onChange={(e) => setFilters({ ...filters, kyc_status: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ search: '', role: 'all', kyc_status: 'all', page: 1 })}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KYC Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.user_role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.user_role === 'verified_investor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.user_role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
                            user.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.kyc_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(user.wallet_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {user.user_role !== 'admin' && (
                            <>
                              <button
                                onClick={() => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                                className={`${
                                  user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              {user.kyc_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUserAction(user.id, 'approve_kyc')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve KYC
                                  </button>
                                  <button
                                    onClick={() => handleUserAction(user.id, 'reject_kyc')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject KYC
                                  </button>
                                </>
                              )}
                              {user.user_role === 'user' && user.kyc_status === 'approved' && (
                                <button
                                  onClick={() => handleUserAction(user.id, 'promote_to_verified')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Promote to Verified
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: Math.min(pagination.total_pages, filters.page + 1) })}
                      disabled={filters.page === pagination.total_pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((filters.page - 1) * pagination.per_page) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(filters.page * pagination.per_page, pagination.total_users)}
                        </span> of{' '}
                        <span className="font-medium">{pagination.total_users}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                          disabled={filters.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setFilters({ ...filters, page: Math.min(pagination.total_pages, filters.page + 1) })}
                          disabled={filters.page === pagination.total_pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KYC Tab */}
        {activeTab === 'kyc' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">KYC Review Panel</h3>
              <a
                href="/admin/kyc"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open KYC Review Panel
              </a>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">KYC Document Review</h4>
              <p className="text-gray-600 mb-4">
                Review and approve user KYC submissions. Click the button above to access the full KYC review interface.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Users cannot trade until their KYC is approved by an admin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Dashboard</h3>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h4>
              <p className="text-gray-600">
                Detailed charts and analytics for trading volume, user growth, and market trends will be available here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}