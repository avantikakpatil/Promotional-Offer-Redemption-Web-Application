import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { Search, ChevronLeft, ChevronRight, X, Eye, Download, Calendar, Tag, Hash, Star, DollarSign, ShoppingCart } from 'lucide-react';

const RedemptionDetailsModal = ({ redemption, onClose }) => {
  if (!redemption) return null;

  const redeemedProducts = redemption?.redeemedProductDetails || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Redemption Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Detailed information for QR Code: {redemption.qrCode}</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center"><Tag className="mr-2" size={20} /> Transaction Info</h3>
              <p className="text-sm text-gray-600 flex items-center mb-2"><Hash className="mr-2" size={14} /> <strong>Voucher ID:</strong> {redemption.voucherId || 'N/A'}</p>
              <p className="text-sm text-gray-600 flex items-center mb-2"><Star className="mr-2" size={14} /> <strong>Points:</strong> {redemption.points}</p>
              <p className="text-sm text-gray-600 flex items-center mb-2"><DollarSign className="mr-2" size={14} /> <strong>Value:</strong> ₹{redemption.redemptionValue || 0}</p>
              <p className="text-sm text-gray-600 flex items-center"><Calendar className="mr-2" size={14} /> <strong>Redeemed At:</strong> {new Date(redemption.redeemedAt).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-800 mb-3">Reseller</h3>
              <p className="text-sm text-gray-600"><strong>ID:</strong> {redemption.resellerId || 'N/A'}</p>
              {/* In a real app, you'd fetch reseller details based on the ID */}
              <p className="text-sm text-gray-600"><strong>Name:</strong> Reseller Name Placeholder</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center"><ShoppingCart className="mr-2" size={20} /> Redeemed Products</h3>
            {typeof redeemedProducts === 'string' ? (
              <p className="text-sm bg-gray-100 p-3 rounded-md">{redeemedProducts}</p>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {redeemedProducts.map((Products, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Products.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Products.quantity || 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Products.retailPrice || Products.value || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                <Download size={16} className="mr-2" />
                Download Receipt
            </button>
        </div>
      </div>
    </div>
  );
};

const ShopkeeperRedemptionHistory = () => {
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRedemptionHistory();
  }, []);

  const fetchRedemptionHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shopkeeper/redemption/history');
      setRedemptionHistory(response.data || []);
    } catch (err) {
      setError('Failed to fetch redemption history');
      console.error('Error fetching redemption history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return redemptionHistory
      .filter(entry => {
        if (filter === 'all') return true;
        return entry.redemptionType === filter;
      })
      .filter(entry => {
        if (!searchQuery) return true;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return (
          entry.qrCode?.toLowerCase().includes(lowerCaseQuery) ||
          entry.voucherId?.toString().toLowerCase().includes(lowerCaseQuery) ||
          entry.resellerId?.toString().toLowerCase().includes(lowerCaseQuery)
        );
      });
  }, [redemptionHistory, filter, searchQuery]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Redemption History</h1>

      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by QR Code, Voucher ID, or Reseller ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'voucher', 'voucher_restricted'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedHistory.map(redemption => (
                <tr key={redemption.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{redemption.qrCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      redemption.redemptionType === 'voucher_restricted' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {redemption.redemptionType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(redemption.redeemedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{redemption.redemptionValue || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setSelectedRedemption(redemption)}
                      className="text-blue-600 hover:text-blue-900 flex items-center">
                      <Eye size={16} className="mr-1" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="text-center p-12">
            <h3 className="text-xl font-semibold text-gray-800">No Results Found</h3>
            <p className="text-gray-600 mt-2">No redemption history matches your search query or filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={16} className="inline mr-1"/>
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} className="inline ml-1"/>
          </button>
        </div>
      )}

      <RedemptionDetailsModal redemption={selectedRedemption} onClose={() => setSelectedRedemption(null)} />
    </div>
  );
};

export default ShopkeeperRedemptionHistory;