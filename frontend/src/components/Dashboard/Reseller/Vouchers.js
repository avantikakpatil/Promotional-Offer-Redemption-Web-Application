import React, { useEffect, useState } from 'react';
import { campaignAPI } from '../../../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import ResellerLayout from './ResellerLayout';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  const [autoGenAttempted, setAutoGenAttempted] = useState(false); // Prevent repeated auto-generation
  const [debugVouchers, setDebugVouchers] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState({});

  useEffect(() => {
    fetchVouchers();
    // eslint-disable-next-line
  }, []);

  // Modified fetchVouchers to auto-generate if none exist
  const fetchVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await campaignAPI.getResellerVouchers();
      const fetchedVouchers = response.data || [];
      setVouchers(fetchedVouchers);
      // Auto-generate vouchers if none exist and not already attempted
      if (fetchedVouchers.length === 0 && !autoGenAttempted) {
        setAutoGenAttempted(true);
        await handleGenerateVouchers(true); // Pass flag to indicate auto-generation
      }
    } catch (err) {
      setError('Failed to fetch vouchers.');
    } finally {
      setLoading(false);
    }
  };

  // Accept an optional flag to suppress messages for auto-generation
  const handleGenerateVouchers = async (isAuto = false) => {
    setGenLoading(true);
    if (!isAuto) setGenMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/generate-vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (!isAuto) setGenMsg(data.message || 'Vouchers generated successfully!');
        await fetchVouchers();
      } else {
        let errorMsg = data.message || 'Failed to generate vouchers.';
        if (data.errors && Array.isArray(data.errors)) {
          errorMsg += '\n' + data.errors.join('\n');
        }
        if (!isAuto) setGenMsg(errorMsg);
      }
    } catch (err) {
      if (!isAuto) setGenMsg('Error generating vouchers.');
    } finally {
      setGenLoading(false);
    }
  };

  // Download individual voucher as image
  const downloadVoucherImage = async (voucherId) => {
    setDownloadLoading(prev => ({ ...prev, [voucherId]: true }));
    try {
      const voucherCard = document.getElementById(`voucher-card-${voucherId}`);
      if (!voucherCard) {
        console.error('Voucher card not found');
        return;
      }

      const canvas = await html2canvas(voucherCard, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const voucher = vouchers.find(v => v.id === voucherId);
      const link = document.createElement('a');
      link.download = `voucher-${voucher?.voucherCode || voucherId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading voucher:', error);
    } finally {
      setDownloadLoading(prev => ({ ...prev, [voucherId]: false }));
    }
  };

  // Download all vouchers
  const downloadAllVouchers = async () => {
    for (const voucher of vouchers) {
      await downloadVoucherImage(voucher.id);
      // Add small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <ResellerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Vouchers</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchVouchers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => handleGenerateVouchers(false)}
              disabled={genLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {genLoading ? 'Generating...' : 'Generate Vouchers'}
            </button>
            {vouchers.length > 0 && (
              <button
                onClick={downloadAllVouchers}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>
            )}
          </div>
        </div>
        
        {genMsg && (
          <div className={`mt-2 px-4 py-2 rounded-lg ${genMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {genMsg}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        

        
        {!loading && vouchers.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No vouchers found</h3>
            <p className="text-gray-600">You have not earned any vouchers yet. Participate in campaigns to earn rewards!</p>
          </div>
        )}
        
        {!loading && vouchers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vouchers.map((voucher) => (
              <div 
                key={voucher.id} 
                id={`voucher-card-${voucher.id}`} 
                className="bg-white rounded-lg shadow p-6 flex flex-col justify-between h-full border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-lg font-bold text-blue-700">{voucher.voucherCode}</span>
                  {voucher.isRedeemed ? (
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Redeemed</span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Not Redeemed</span>
                  )}
                </div>
                
                {/* QR Code Display */}
                <div className="flex flex-col items-center my-4">
                  {voucher.qrCode ? (
                    <QRCodeCanvas 
                      id={`qr-canvas-${voucher.id}`} 
                      value={voucher.qrCode} 
                      size={128} 
                      className="border border-gray-200 rounded"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400">No QR code</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <div className="text-sm text-gray-600 mb-1">
                    Campaign: <span className="font-semibold text-gray-800">{voucher.campaignName}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Value: <span className="font-semibold text-gray-800">₹{voucher.value}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Points Required: <span className="font-semibold text-gray-800">{voucher.pointsRequired}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Expiry: <span className="font-semibold text-gray-800">{new Date(voucher.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Download Button */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => downloadVoucherImage(voucher.id)}
                    disabled={downloadLoading[voucher.id]}
                    className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloadLoading[voucher.id] ? 'Downloading...' : 'Download Voucher'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResellerLayout>
  );
};

export default Vouchers;