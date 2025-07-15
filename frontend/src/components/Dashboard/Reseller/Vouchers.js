import React, { useEffect, useState } from 'react';
import { campaignAPI } from '../../../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  const [autoGenAttempted, setAutoGenAttempted] = useState(false); // Prevent repeated auto-generation

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
        if (!isAuto) setGenMsg(data.message || 'Failed to generate vouchers.');
      }
    } catch (err) {
      if (!isAuto) setGenMsg('Error generating vouchers.');
    } finally {
      setGenLoading(false);
    }
  };

  return (
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
            onClick={handleGenerateVouchers}
            disabled={genLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {genLoading ? 'Generating...' : 'Generate Vouchers'}
          </button>
        </div>
      </div>
      {genMsg && (
        <div className={`mt-2 px-4 py-2 rounded-lg ${genMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{genMsg}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
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
          {vouchers.map(voucher => {
            const handleDownload = async () => {
              const card = document.getElementById(`voucher-card-${voucher.id}`);
              if (card) {
                const canvas = await html2canvas(card);
                const url = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = url;
                link.download = `${voucher.voucherCode}_voucher.png`;
                link.click();
              }
            };
            return (
              <div key={voucher.id} id={`voucher-card-${voucher.id}`} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between h-full border border-gray-100">
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
                    <QRCodeCanvas id={`qr-canvas-${voucher.id}`} value={voucher.qrCode} size={128} />
                  ) : (
                    <span className="text-gray-400">No QR code</span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600 mb-1">Campaign: <span className="font-semibold text-gray-800">{voucher.campaignName}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Value: <span className="font-semibold text-gray-800">₹{voucher.value}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Points Required: <span className="font-semibold text-gray-800">{voucher.pointsRequired}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Expiry: <span className="font-semibold text-gray-800">{new Date(voucher.expiryDate).toLocaleDateString()}</span></div>
                </div>
                {voucher.qrCode && (
                  <button
                    onClick={handleDownload}
                    className="mt-4 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Download Voucher
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Vouchers; 