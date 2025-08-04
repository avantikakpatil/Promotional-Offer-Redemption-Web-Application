import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaEye, FaDownload, FaLightbulb, FaCalculator, FaStar } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [campaignSuggestions, setCampaignSuggestions] = useState([]);
  const [calculatingPoints, setCalculatingPoints] = useState(false);
  const [syncingPoints, setSyncingPoints] = useState(false);
  
  const { user } = useAuth();
  const resellerId = user?.id || 1;

  useEffect(() => {
    fetchOrders();
    fetchCampaigns();
    fetchOrderSuggestions();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/available-campaigns', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchOrderSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/suggestions', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaignSuggestions(data.suggestions || []);
      } else {
        // Fallback to local generation if API fails
        generateCampaignSuggestions();
      }
    } catch (err) {
      console.error('Error fetching order suggestions:', err);
      // Fallback to local generation if API fails
      generateCampaignSuggestions();
    }
  };

  const generateCampaignSuggestions = () => {
    const suggestions = campaigns.map(campaign => {
      // Generate random suggestion data for demonstration
      const random = Math.random();
      const suggestedQuantity = Math.floor(random * 10) + 1;
      const suggestedProduct = {
        name: `Product for ${campaign.name}`,
        pointsPerUnit: Math.floor(random * 50) + 10,
        resellerPrice: Math.floor(random * 1000) + 500,
        suggestedQuantity: suggestedQuantity,
        totalPoints: (Math.floor(random * 50) + 10) * suggestedQuantity,
        totalValue: (Math.floor(random * 1000) + 500) * suggestedQuantity
      };

      return {
        campaign: campaign,
        product: suggestedProduct,
        suggestion: {
          suggestedQuantity: suggestedQuantity,
          totalValue: suggestedProduct.totalValue,
          totalPoints: suggestedProduct.totalPoints,
          benefit: `Earn ${suggestedProduct.totalPoints} points with ₹${suggestedProduct.totalValue.toLocaleString()} order`,
          recommendation: `Order ${suggestedQuantity} units to maximize points earning`
        }
      };
    });

    setCampaignSuggestions(suggestions);
  };

  const calculatePoints = async () => {
    try {
      setCalculatingPoints(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/calculate-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully calculated points for ${result.totalOrdersUpdated} orders. Total points: ${result.totalPointsCalculated}`);
        // Refresh orders to show updated points
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error calculating points:', err);
      alert('Failed to calculate points');
    } finally {
      setCalculatingPoints(false);
    }
  };

  const syncCampaignPoints = async () => {
    try {
      setSyncingPoints(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/sync-campaign-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully synced points for ${result.totalCampaignsUpdated} campaigns.`);
        // Refresh orders to show updated points
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error syncing campaign points:', err);
      alert('Failed to sync campaign points');
    } finally {
      setSyncingPoints(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Orders & Campaigns</h1>
            <p className="text-gray-600 mt-2">View your orders and discover campaign opportunities</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={calculatePoints}
              disabled={calculatingPoints}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {calculatingPoints ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FaCalculator className="mr-2" />
              )}
              {calculatingPoints ? 'Calculating...' : 'Calculate Points'}
            </button>
            <button
              onClick={syncCampaignPoints}
              disabled={syncingPoints}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {syncingPoints ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FaLightbulb className="mr-2" />
              )}
              {syncingPoints ? 'Syncing...' : 'Sync Campaign Points'}
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Suggestions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FaLightbulb className="text-2xl text-yellow-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Campaign Suggestions</h2>
        </div>
        <p className="text-gray-600 mb-4">Place orders for these products in your existing system to earn points:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignSuggestions.map((suggestion, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{suggestion.campaign.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  suggestion.campaign.assignment?.isApproved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {suggestion.campaign.assignment?.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <strong>Product:</strong> {suggestion.product.name}
                </p>
                <p className="text-gray-600">
                  <strong>Brand:</strong> {suggestion.product.brand || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <strong>Suggested Quantity:</strong> {suggestion.suggestion.suggestedQuantity}
                </p>
                <p className="text-gray-600">
                  <strong>Price per Unit:</strong> ₹{suggestion.product.resellerPrice.toLocaleString()}
                </p>
                <p className="text-gray-600">
                  <strong>Points per Unit:</strong> {suggestion.product.pointsPerUnit}
                </p>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-green-600 font-medium">{suggestion.suggestion.benefit}</p>
                  <p className="text-gray-500 text-xs">
                    Total Value: ₹{suggestion.suggestion.totalValue.toLocaleString()}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    {suggestion.suggestion.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {campaignSuggestions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No suggestions available</h3>
            <p className="text-gray-600">Get approved for campaigns to see order suggestions.</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaShoppingCart className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaStar className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.reduce((sum, order) => sum + (order.totalPointsEarned || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(order => order.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Order History</h2>
          <p className="text-gray-600 mt-1">Orders from your existing system</p>
        </div>
        
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.orderItems?.length || 0} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.campaign?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.campaign?.manufacturer?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        +{order.totalPointsEarned || 0} points
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <FaEye className="text-lg" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <FaDownload className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <FaShoppingCart className="text-6xl mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">Orders from your existing system will appear here</p>
            <div className="text-sm text-gray-500">
              <p>Check the campaign suggestions above to see what products to order</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders; 