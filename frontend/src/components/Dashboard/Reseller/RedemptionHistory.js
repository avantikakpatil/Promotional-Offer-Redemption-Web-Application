import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaTicketAlt, FaDownload, FaEye } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';

const RedemptionHistory = () => {
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [voucherRedemptions, setVoucherRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const resellerId = user?.id || 1;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchVoucherRedemptions()
      ]);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
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
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchVoucherRedemptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/qrcodes/history', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only voucher redemptions
        const voucherHistory = data.redemptionHistory?.filter(item => 
          item.redemptionType === 'voucher' || item.voucherId
        ) || [];
        setVoucherRedemptions(voucherHistory);
      }
    } catch (err) {
      console.error('Error fetching voucher redemptions:', err);
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

  const getFilteredData = () => {
    if (filter === 'orders') return orders;
    if (filter === 'vouchers') return voucherRedemptions;
    return [...orders, ...voucherRedemptions];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  const totalOrders = orders.length;
  const totalVoucherRedemptions = voucherRedemptions.length;
  const totalPointsEarned = orders.reduce((sum, order) => sum + (order.totalPointsEarned || 0), 0);
  const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Order & Redemption History</h1>
        <p className="text-gray-600 mt-2">Track your orders and voucher redemptions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaShoppingCart className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaTicketAlt className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Voucher Redemptions</p>
              <p className="text-2xl font-bold text-gray-900">{totalVoucherRedemptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
              <p className="text-2xl font-bold text-gray-900">{totalPointsEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setFilter('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'orders' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Orders ({totalOrders})
          </button>
          <button
            onClick={() => setFilter('vouchers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'vouchers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Voucher Redemptions ({totalVoucherRedemptions})
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {getFilteredData().map((item, index) => (
          <div key={`${item.id || index}-${item.orderNumber || item.qrCode}`} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Order Item */}
              {item.orderNumber && (
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FaShoppingCart className="text-2xl mr-3 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{item.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{item.campaign?.name || 'Unknown Campaign'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              )}

              {/* Voucher Redemption Item */}
              {item.qrCode && !item.orderNumber && (
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FaTicketAlt className="text-2xl mr-3 text-green-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Voucher Redemption</h3>
                      <p className="text-sm text-gray-600">QR: {item.qrCode}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Voucher Redeemed
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Details</h4>
                  <p className="text-sm text-gray-600">
                    Date: {formatDate(item.orderDate || item.redeemedAt)}
                  </p>
                  {item.totalPointsEarned && (
                    <p className="text-sm text-gray-600">Points Earned: +{item.totalPointsEarned}</p>
                  )}
                  {item.points && (
                    <p className="text-sm text-gray-600">Points: {item.points}</p>
                  )}
                  {item.totalAmount && (
                    <p className="text-sm text-gray-600">Order Value: ₹{item.totalAmount.toLocaleString()}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Additional Info</h4>
                  {item.campaign?.manufacturer?.name && (
                    <p className="text-sm text-gray-600">Manufacturer: {item.campaign.manufacturer.name}</p>
                  )}
                  {item.orderItems && (
                    <p className="text-sm text-gray-600">Items: {item.orderItems.length}</p>
                  )}
                  {item.voucherId && (
                    <p className="text-sm text-gray-600">Voucher ID: {item.voucherId}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaEye className="inline mr-2" />
                  View Details
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaDownload className="inline mr-2" />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {getFilteredData().length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No history found</h3>
          <p className="text-gray-600">There are no orders or redemptions matching your current filter.</p>
        </div>
      )}
    </div>
  );
};

export default RedemptionHistory; 