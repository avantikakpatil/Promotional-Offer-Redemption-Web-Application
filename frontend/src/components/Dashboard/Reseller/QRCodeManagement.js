import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const QRCodeManagement = () => {
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQRCodes();
    fetchAvailableVouchers();
  }, []);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reseller/qrcodes');
      setQrCodes(response.data);
    } catch (err) {
      setError('Failed to fetch QR codes');
      console.error('Error fetching QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVouchers = async () => {
    try {
      const response = await api.get('/reseller/voucher');
      const activeVouchers = response.data.filter(voucher => 
        !voucher.isRedeemed && new Date(voucher.expiryDate) > new Date()
      );
      setAvailableVouchers(activeVouchers);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    }
  };

  const getStatusColor = (qrCode) => {
    if (qrCode.isRedeemed) return 'bg-blue-100 text-blue-800';
    if (qrCode.expiryDate && new Date(qrCode.expiryDate) <= new Date()) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (qrCode) => {
    if (qrCode.isRedeemed) return 'Used';
    if (qrCode.expiryDate && new Date(qrCode.expiryDate) <= new Date()) return 'Expired';
    return 'Active';
  };

  const handleGenerateQR = async () => {
    if (!selectedVoucher) {
      alert('Please select a voucher first!');
      return;
    }
    
    try {
      const response = await api.post(`/reseller/voucher/${selectedVoucher}/generate-qr`, {
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });
      
      // Refresh QR codes list
      await fetchQRCodes();
      setShowQRModal(false);
      alert('QR code generated successfully!');
    } catch (err) {
      alert('Failed to generate QR code: ' + (err.response?.data || err.message));
    }
  };

  const handleDownloadQR = (qrCode) => {
    // Here you would implement QR code download functionality
    console.log('Downloading QR code for:', qrCode.code);
    alert('QR code download functionality would be implemented here');
  };

  const handleCopyCode = (qrCode) => {
    navigator.clipboard.writeText(qrCode.code);
    alert('QR code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading QR codes...</div>
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
        <h1 className="text-3xl font-bold text-gray-800">QR Code Management</h1>
        <p className="text-gray-600 mt-2">Generate and manage QR codes for your vouchers</p>
      </div>

      {/* Generate New QR Code */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate New QR Code</h2>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Voucher
            </label>
            <select
              value={selectedVoucher || ''}
              onChange={(e) => setSelectedVoucher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a voucher...</option>
              {availableVouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.voucherCode} - ₹{voucher.value}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleGenerateQR}
            disabled={!selectedVoucher}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate QR Code
          </button>
        </div>
      </div>

      {/* QR Codes List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Generated QR Codes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qrCodes.map((qrCode) => (
                <tr key={qrCode.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{qrCode.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{qrCode.points}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(qrCode)}`}>
                      {getStatusText(qrCode)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(qrCode.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {qrCode.redeemedAt ? new Date(qrCode.redeemedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadQR(qrCode)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleCopyCode(qrCode)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Copy Code
                      </button>
                      <button
                        onClick={() => setShowQRModal(true)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {qrCodes.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No QR codes generated</h3>
            <p className="text-gray-600">Generate your first QR code to get started.</p>
          </div>
        )}
      </div>

      {/* QR Code Preview Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">QR Code Preview</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="w-48 h-48 mx-auto bg-white flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-500">QR Code Image</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                QR Code: {selectedVoucher ? qrCodes.find(qr => qr.voucherId == selectedVoucher)?.code || 'Generated' : 'Select Voucher'}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadQR({ code: selectedVoucher })}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Download
                </button>
                <button
                  onClick={() => handleCopyCode({ code: selectedVoucher })}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManagement; 