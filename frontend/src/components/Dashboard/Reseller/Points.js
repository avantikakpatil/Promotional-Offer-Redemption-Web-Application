import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const Points = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real data states
  const [pointsData, setPointsData] = useState({
    totalPoints: 0,
    availablePoints: 0,
    usedPoints: 0,
    pendingPoints: 0
  });
  const [pointsHistory, setPointsHistory] = useState([]);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // Fetch points data
      const pointsResponse = await fetch('/api/reseller/order/points', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (pointsResponse.ok) {
        const pointsResult = await pointsResponse.json();
        setPointsData({
          totalPoints: pointsResult.CurrentPoints || 0,
          availablePoints: pointsResult.CurrentPoints || 0,
          usedPoints: 0, // This would need to be calculated from history
          pendingPoints: 0 // This would need to be calculated from pending orders
        });
      }
      
      // Fetch redemption history
      const historyResponse = await fetch('/api/reseller/qrcodes/history', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        const history = historyResult.redemptionHistory || [];
        
        // Transform history data to match the expected format
        const transformedHistory = history.map((item, index) => ({
          id: item.id || index + 1,
          type: item.points > 0 ? 'Earned' : 'Used',
          amount: item.points,
          source: item.campaignName || 'QR Code Redemption',
          date: new Date(item.redeemedAt).toLocaleDateString(),
          status: 'Completed',
          description: `${item.points > 0 ? 'Points earned from' : 'Points used for'} ${item.campaignName || 'QR code redemption'}`,
          qrCode: item.qrCode,
          customerName: item.customerName
        }));
        
        setPointsHistory(transformedHistory);
      }
    } catch (err) {
      console.error('Error fetching points data:', err);
      setError('Failed to load points data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = pointsHistory.filter(entry => {
    if (filter === 'all') return true;
    return entry.type.toLowerCase() === filter.toLowerCase();
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">My Points</h1>
        <p className="text-gray-600 mt-2">Track your points balance and transaction history</p>
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
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900">{pointsData.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Points</p>
                  <p className="text-2xl font-bold text-gray-900">{pointsData.availablePoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Points</p>
                  <p className="text-2xl font-bold text-gray-900">{pointsData.pendingPoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Used Points</p>
                  <p className="text-2xl font-bold text-gray-900">{pointsData.usedPoints}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Points History */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Points History</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('earned')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'earned' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Earned
                  </button>
                  <button
                    onClick={() => setFilter('used')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'used' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Used
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'pending' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.amount > 0 ? '+' : ''}{entry.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredHistory.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No transactions found</h3>
                <p className="text-gray-600">There are no points transactions matching your current filter.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Points; 