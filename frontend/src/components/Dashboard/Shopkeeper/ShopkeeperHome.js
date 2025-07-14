import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const ShopkeeperHome = () => {
  const [stats, setStats] = useState({
    totalRedemptions: 0,
    totalValueRedeemed: 0,
    todayRedemptions: 0,
    averageOrderValue: 0
  });
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShopkeeperData();
  }, []);

  const fetchShopkeeperData = async () => {
    try {
      setLoading(true);
      
      // Fetch shopkeeper statistics
      const statsResponse = await api.get('/shopkeeper/statistics');
      setStats(statsResponse.data);

      // Fetch recent redemptions
      const redemptionsResponse = await api.get('/shopkeeper/redemption-history?limit=5');
      setRecentRedemptions(redemptionsResponse.data);

      // Fetch top products
      const productsResponse = await api.get('/shopkeeper/top-products');
      setTopProducts(productsResponse.data);
    } catch (err) {
      setError('Failed to fetch shopkeeper data');
      console.error('Error fetching shopkeeper data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading shopkeeper data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, Shopkeeper!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your voucher redemptions today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRedemptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value Redeemed</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalValueRedeemed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Redemptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayRedemptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.averageOrderValue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/shopkeeper/scanner"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">📱</span>
            <div>
              <h3 className="font-medium text-gray-800">Scan QR Code</h3>
              <p className="text-sm text-gray-600">Redeem vouchers</p>
            </div>
          </Link>

          <Link
            to="/shopkeeper/products"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">🛍️</span>
            <div>
              <h3 className="font-medium text-gray-800">View Products</h3>
              <p className="text-sm text-gray-600">Eligible for redemption</p>
            </div>
          </Link>

          <Link
            to="/shopkeeper/history"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">📋</span>
            <div>
              <h3 className="font-medium text-gray-800">View History</h3>
              <p className="text-sm text-gray-600">Past redemptions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Redemptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Redemptions</h2>
            <Link to="/shopkeeper/history" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentRedemptions.length > 0 ? (
              recentRedemptions.map((redemption) => (
                <div key={redemption.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800">{redemption.qrCode}</h3>
                    <p className="text-sm text-gray-600">Reseller: {redemption.resellerName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">₹{redemption.redemptionValue || 0}</p>
                    <p className="text-sm text-gray-500">{new Date(redemption.redeemedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No recent redemptions
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Top Products</h2>
            <Link to="/shopkeeper/products" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.redemptions} redemptions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blue-600">₹{product.value}</p>
                    <p className="text-sm text-gray-500">Total value</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No product data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopkeeperHome; 