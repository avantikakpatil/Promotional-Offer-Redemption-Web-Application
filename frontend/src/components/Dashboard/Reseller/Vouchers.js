import React, { useEffect, useState } from 'react';
import { campaignAPI } from '../../../services/api';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState('');

  useEffect(() => {
    fetchVouchers();
    // eslint-disable-next-line
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await campaignAPI.getResellerVouchers();
      setVouchers(response.data || []);
    } catch (err) {
      setError('Failed to fetch vouchers.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVouchers = async () => {
    setGenLoading(true);
    setGenMsg('');
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
        setGenMsg(data.message || 'Vouchers generated successfully!');
        await fetchVouchers();
      } else {
        setGenMsg(data.message || 'Failed to generate vouchers.');
      }
    } catch (err) {
      setGenMsg('Error generating vouchers.');
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
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Voucher Code</th>
                <th className="px-4 py-2 text-left">Campaign</th>
                <th className="px-4 py-2 text-left">Value</th>
                <th className="px-4 py-2 text-left">Points Required</th>
                <th className="px-4 py-2 text-left">Expiry</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(voucher => (
                <tr key={voucher.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2 font-mono">{voucher.voucherCode}</td>
                  <td className="px-4 py-2">{voucher.campaign?.name || voucher.campaignName || '-'}</td>
                  <td className="px-4 py-2 font-semibold text-green-700">₹{voucher.value}</td>
                  <td className="px-4 py-2">{voucher.pointsRequired}</td>
                  <td className="px-4 py-2">{voucher.expiryDate ? new Date(voucher.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">
                    {voucher.isRedeemed ? (
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">Redeemed</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Vouchers; 