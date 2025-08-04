import React, { useState, useEffect } from 'react';
import { FaStar, FaCheckCircle, FaClock, FaMoneyBillWave, FaShoppingCart, FaGift } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Points = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // Campaign-specific points data
  const [campaignPoints, setCampaignPoints] = useState([]);
  const [summary, setSummary] = useState({
    totalPointsEarned: 0,
    totalPointsUsed: 0,
    totalAvailablePoints: 0,
    totalOrderValue: 0,
    totalOrders: 0,
    totalVouchersGenerated: 0,
    totalVoucherValueGenerated: 0
  });
  
  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Fetching points data...');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('User:', user);

      // Fetch campaign-specific points data
      const response = await fetch('/api/reseller/order/points', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Points data received:', data);
        setCampaignPoints(data.campaignPoints || []);
        setSummary(data.summary || {
          totalPointsEarned: 0,
          totalPointsUsed: 0,
          totalAvailablePoints: 0,
          totalOrderValue: 0,
          totalOrders: 0,
          totalVouchersGenerated: 0,
          totalVoucherValueGenerated: 0
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching points data:', err);
      setError(`Failed to load points data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshPointsData = async () => {
    try {
      setRefreshing(true);
      setError('');
      await fetchPointsData();
    } catch (err) {
      console.error('Error refreshing points data:', err);
      setError('Failed to refresh points data.');
    } finally {
      setRefreshing(false);
    }
  };

  const testPublicEndpoint = async () => {
    try {
      console.log('Testing public endpoint...');
      const response = await fetch('/api/reseller/order/public-test');
      const data = await response.json();
      console.log('Public test response:', data);
      alert(`Public test: ${data.message}\nResellers: ${data.databaseStats.resellerCount}\nCampaigns: ${data.databaseStats.campaignCount}\nOrders: ${data.databaseStats.orderCount}\nCampaign Points: ${data.databaseStats.campaignPointsCount}`);
    } catch (err) {
      console.error('Error testing public endpoint:', err);
      alert(`Error testing public endpoint: ${err.message}`);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Earned':
        return 'bg-green-100 text-green-800';
      case 'Used':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Points</h1>
            <p className="text-gray-600 mt-2">Track your points balance and campaign performance</p>
          </div>
          <button
            onClick={refreshPointsData}
            disabled={refreshing || loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <span className="mr-2">🔄</span>
            )}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => navigate('/reseller/dashboard/vouchers')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-2"
          >
            <FaGift className="mr-2" />
            Generate Vouchers
          </button>
          <button
            onClick={testPublicEndpoint}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ml-2"
          >
            <span className="mr-2">🧪</span>
            Test API
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading points data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchPointsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Points Overview */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FaStar className="text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalPointsEarned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FaCheckCircle className="text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Points</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalAvailablePoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <FaMoneyBillWave className="text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Points Used</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalPointsUsed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FaGift className="text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vouchers Generated</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalVouchersGenerated}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <FaShoppingCart className="text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{summary.totalOrderValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Voucher Value Generated</p>
                  <p className="text-2xl font-bold text-gray-900">₹{summary.totalVoucherValueGenerated.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Points Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Campaign Points Breakdown</h2>
              <p className="text-gray-600 mt-1">Points earned from each campaign</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points Earned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vouchers Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignPoints.map((campaign) => (
                    <tr key={campaign.campaignId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.campaignName || 'Unknown Campaign'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          +{campaign.totalPointsEarned}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-red-600">
                          {campaign.pointsUsedForVouchers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {campaign.availablePoints}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{campaign.totalOrderValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.totalVouchersGenerated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(campaign.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {campaignPoints.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No campaign points found</h3>
                <p className="text-gray-600">Start placing orders to earn points from campaigns.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Points; 