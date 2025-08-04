import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { campaignAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const ResellerHome = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real data states
  const [stats, setStats] = useState({
    totalPoints: 0,
    availableVouchers: 0,
    activeCampaigns: 0,
    totalOrders: 0,
    totalOrderValue: 0
  });
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  
  const { user } = useAuth();
  const resellerId = user?.id || 1;

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all data in parallel
      await Promise.all([
        fetchCampaigns(),
        fetchUserPoints(),
        fetchRecentOrders(),
        fetchVouchers()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const fetchCampaigns = async () => {
    try {
      // First try to get detailed campaigns from the public endpoint
      const response = await campaignAPI.getAllCampaigns();
      let campaignsData = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        campaignsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        campaignsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        campaignsData = response.data;
      } else {
        console.warn('Unexpected response format from getAllCampaigns:', response.data);
        // Fallback to available campaigns endpoint
        const fallbackResponse = await campaignAPI.getAvailableCampaigns();
        campaignsData = fallbackResponse.data || [];
      }
      
      // Take only the first 3 campaigns for the recent section
      setCampaigns(campaignsData.slice(0, 3));
      
      // Update active campaigns count (all active campaigns, no approval needed)
      const now = new Date();
      const activeCampaignsCount = campaignsData.filter(campaign => {
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);
        return campaign.isActive && startDate <= now && endDate >= now;
      }).length;
      
      setStats(prevStats => ({
        ...prevStats,
        activeCampaigns: activeCampaignsCount
      }));
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      // Fallback to available campaigns if getAllCampaigns fails
      try {
        const fallbackResponse = await campaignAPI.getAvailableCampaigns();
        const campaignsData = fallbackResponse.data || [];
        setCampaigns(campaignsData.slice(0, 3));
        
        const now = new Date();
        const activeCampaignsCount = campaignsData.filter(campaign => {
          const startDate = new Date(campaign.startDate);
          const endDate = new Date(campaign.endDate);
          return campaign.isActive && startDate <= now && endDate >= now;
        }).length;
        
        setStats(prevStats => ({
          ...prevStats,
          activeCampaigns: activeCampaignsCount
        }));
      } catch (fallbackErr) {
        console.error('Fallback campaign fetch also failed:', fallbackErr);
      }
    }
  };

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/points', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          totalPoints: data.points || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching user points:', err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        setRecentOrders(orders.slice(0, 5)); // Get last 5 orders
        
        // Calculate total order value
        const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        setStats(prevStats => ({
          ...prevStats,
          totalOrders: orders.length,
          totalOrderValue: totalValue
        }));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await campaignAPI.getResellerVouchers();
      const vouchers = response.data || [];
      setRecentVouchers(vouchers.slice(0, 3)); // Get first 3 vouchers
      setStats(prevStats => ({
        ...prevStats,
        availableVouchers: vouchers.filter(v => v.isRedeemed === false).length
      }));
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    }
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    
    if (!campaign.isActive) return 'Inactive';
    if (startDate > now) return 'Upcoming';
    if (endDate < now) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, Reseller!</h1>
        <p className="text-gray-600 mt-2">Track your orders and manage your points from campaigns.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Vouchers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableVouchers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FaShoppingCart className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <FaChartLine className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/reseller/campaigns"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <h3 className="font-medium text-gray-800">Browse Campaigns</h3>
              <p className="text-sm text-gray-600">Find new opportunities</p>
            </div>
          </Link>

          <Link
            to="/reseller/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaShoppingCart className="text-2xl mr-3 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-800">View Orders</h3>
              <p className="text-sm text-gray-600">Check your order history</p>
            </div>
          </Link>

          <Link
            to="/reseller/vouchers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">🎫</span>
            <div>
              <h3 className="font-medium text-gray-800">Create Voucher</h3>
              <p className="text-sm text-gray-600">Convert points to vouchers</p>
            </div>
          </Link>

          <Link
            to="/reseller/points"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">📊</span>
            <div>
              <h3 className="font-medium text-gray-800">View Points</h3>
              <p className="text-sm text-gray-600">Track your earnings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Campaigns</h2>
            <Link to="/reseller/campaigns" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={fetchAllData}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                return (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">
                        by {campaign.manufacturer?.name || 'Unknown Manufacturer'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Valid until: {new Date(campaign.endDate).toLocaleDateString()}
                      </p>
                      {campaign.assignment && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          campaign.assignment.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.assignment.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      )}
                      {/* Show reward tiers if available */}
                      {Array.isArray(campaign.rewardTiers) && campaign.rewardTiers.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Reward Tiers:</p>
                          <div className="space-y-1">
                            {campaign.rewardTiers.slice(0, 2).map((tier, idx) => (
                              <div key={tier.id || idx} className="text-xs">
                                <span className="text-blue-600 font-medium">{tier.threshold} pts</span>
                                <span className="text-gray-600"> → {tier.reward}</span>
                              </div>
                            ))}
                            {campaign.rewardTiers.length > 2 && (
                              <div className="text-xs text-gray-500">+{campaign.rewardTiers.length - 2} more tiers</div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Show voucher settings if available */}
                      {(campaign.voucherGenerationThreshold || campaign.voucherValue) && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Voucher Settings:</p>
                          <div className="text-xs text-purple-600">
                            {campaign.voucherGenerationThreshold && (
                              <span className="mr-2">Threshold: {campaign.voucherGenerationThreshold} pts</span>
                            )}
                            {campaign.voucherValue && (
                              <span>Value: ₹{campaign.voucherValue}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium text-blue-600">{campaign.points} points</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">No campaigns available</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/reseller/orders" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600">₹{order.totalAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-green-600">+{order.totalPointsEarned || 0} points</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">No orders yet</p>
              <Link to="/reseller/orders" className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline">
                Place your first order
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Vouchers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Vouchers</h2>
          <Link to="/reseller/vouchers" className="text-blue-600 hover:text-blue-800 text-sm">
            View all
          </Link>
        </div>
        {recentVouchers.length > 0 ? (
          <div className="space-y-3">
            {recentVouchers.map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">{voucher.voucherCode || voucher.code}</h3>
                  <p className="text-sm text-gray-600">Value: ₹{voucher.value}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    voucher.isRedeemed 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {voucher.isRedeemed ? 'Used' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">No vouchers available</p>
            <Link to="/reseller/vouchers" className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline">
              Create your first voucher
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResellerHome; 