import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const RedemptionHistory = () => {
  const [filter, setFilter] = useState('all');
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRedemptionHistory();
  }, []);

  const fetchRedemptionHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reseller/redemption-history');
      setRedemptionHistory(response.data);
    } catch (err) {
      setError('Failed to fetch redemption history');
      console.error('Error fetching redemption history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = redemptionHistory.filter(entry => {
    if (filter === 'all') return true;
    return entry.redemptionType.toLowerCase() === filter.toLowerCase();
  });

  const getStatusColor = (entry) => {
    if (entry.redemptionType === 'voucher') return 'bg-green-100 text-green-800';
    if (entry.redemptionType === 'qr_code') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (entry) => {
    if (entry.redemptionType === 'voucher') return '🎫';
    if (entry.redemptionType === 'qr_code') return '📱';
    return '❓';
  };

  const getStatusText = (entry) => {
    if (entry.redemptionType === 'voucher') return 'Voucher Redemption';
    if (entry.redemptionType === 'qr_code') return 'QR Code Redemption';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading redemption history...</div>
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
        <h1 className="text-3xl font-bold text-gray-800">Redemption History</h1>
        <p className="text-gray-600 mt-2">Track voucher redemptions by shopkeepers</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
              <p className="text-2xl font-bold text-gray-900">{redemptionHistory.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">₹{redemptionHistory.reduce((sum, item) => sum + (item.redemptionValue || 0), 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">🏪</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Shopkeepers</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(redemptionHistory.map(item => item.shopkeeperId)).size}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                {redemptionHistory.reduce((sum, item) => sum + (item.points || 0), 0)}
              </p>
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
            All Redemptions
          </button>
          <button
            onClick={() => setFilter('voucher')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'voucher' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Voucher Redemptions
          </button>
          <button
            onClick={() => setFilter('qr_code')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'qr_code' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            QR Code Redemptions
          </button>
        </div>
      </div>

      {/* Redemption History */}
      <div className="space-y-4">
        {filteredHistory.map((redemption) => (
          <div key={redemption.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getStatusIcon(redemption)}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{redemption.qrCode || 'QR Code'}</h3>
                    <p className="text-sm text-gray-600">{redemption.points} points earned</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(redemption)}`}>
                  {getStatusText(redemption)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Redemption Details</h4>
                  <p className="text-sm text-gray-600">Redeemed: {new Date(redemption.redeemedAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Points: {redemption.points}</p>
                  {redemption.redemptionValue && (
                    <p className="text-sm text-gray-600">Value: ₹{redemption.redemptionValue}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Transaction Info</h4>
                  <p className="text-sm text-gray-600">Type: {redemption.redemptionType}</p>
                  {redemption.voucherId && (
                    <p className="text-sm text-gray-600">Voucher ID: {redemption.voucherId}</p>
                  )}
                  {redemption.shopkeeperId && (
                    <p className="text-sm text-gray-600">Shopkeeper ID: {redemption.shopkeeperId}</p>
                  )}
                </div>
              </div>

              {redemption.redeemedProducts && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Products Redeemed</h4>
                  <div className="text-sm text-gray-600">
                    {redemption.redeemedProducts}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Details
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No redemption history found</h3>
          <p className="text-gray-600">There are no redemptions matching your current filter.</p>
        </div>
      )}
    </div>
  );
};

export default RedemptionHistory; 