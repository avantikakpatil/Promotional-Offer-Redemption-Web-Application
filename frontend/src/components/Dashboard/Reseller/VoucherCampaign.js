import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { generateQRCodeDataURL } from '../../../utils/qrGenerator';

const VoucherCampaign = ({ campaign, vouchers, onVoucherGenerated }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiryDate');
  const [qrDataURLs, setQrDataURLs] = useState({});
  const cardRefs = useRef({});

  const campaignVouchers = Array.isArray(vouchers)
    ? vouchers.filter(v => String(v.campaignId) === String(campaign.id))
    : [];

  useEffect(() => {
    const generateQRCodes = async () => {
      try {
        const qrImageMap = {};
        for (const voucher of campaignVouchers) {
          const qrData = voucher.qrCode?.trim() || voucher.voucherCode;
          if (qrData) {
            qrImageMap[voucher.voucherCode] = await generateQRCodeDataURL(qrData, {
              size: 250,
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' }
            });
          }
        }
        setQrDataURLs(qrImageMap);
      } catch {
        setQrDataURLs({});
      }
    };
    if (campaignVouchers.length > 0) generateQRCodes();
  }, [campaignVouchers]);

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const expiryDate = new Date(voucher.expiryDate);
    if (voucher.isRedeemed) return { status: 'redeemed', color: 'bg-red-100 text-red-600', icon: XCircle };
    if (expiryDate < now) return { status: 'expired', color: 'bg-gray-100 text-gray-600', icon: Clock };
    return { status: 'active', color: 'bg-green-100 text-green-600', icon: CheckCircle };
  };

  const filteredVouchers = campaignVouchers.filter(voucher => {
    if (filter === 'all') return true;
    return getVoucherStatus(voucher).status === filter;
  });

  const sortedVouchers = [...filteredVouchers].sort((a, b) => {
    if (sortBy === 'expiryDate') return new Date(a.expiryDate) - new Date(b.expiryDate);
    if (sortBy === 'status') return getVoucherStatus(a).status.localeCompare(getVoucherStatus(b).status);
    if (sortBy === 'voucherCode') return a.voucherCode.localeCompare(b.voucherCode);
    return 0;
  });

  if (!vouchers) {
    return (
      <div className="flex items-center justify-center py-10 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading vouchers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-md items-center">
        <span className="text-xs font-medium text-gray-600">Filter:</span>
        {['all', 'active', 'redeemed', 'expired'].map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2 py-1 rounded-full text-xs font-medium border transition 
              ${filter === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}

        <span className="text-xs font-medium text-gray-600 ml-auto">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-2 py-1 text-xs border rounded-md focus:ring focus:ring-blue-300"
        >
          <option value="expiryDate">Expiry Date</option>
          <option value="status">Status</option>
          <option value="voucherCode">Voucher Code</option>
        </select>

        <button
          onClick={onVoucherGenerated}
          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 ml-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Voucher Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedVouchers.map(voucher => {
          const { status, color, icon: Icon } = getVoucherStatus(voucher);
          return (
            <div key={voucher.voucherCode} className="p-3 bg-white rounded-md shadow-sm border text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
                  {status.toUpperCase()}
                </span>
                <Icon size={14} className={color.split(' ')[1]} />
              </div>
              <p className="font-medium">{voucher.voucherCode}</p>
              <p className="text-gray-500 text-[11px]">Expiry: {new Date(voucher.expiryDate).toLocaleDateString()}</p>
              {qrDataURLs[voucher.voucherCode] && (
                <img src={qrDataURLs[voucher.voucherCode]} alt="QR Code" className="mt-2 w-20 h-20 mx-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoucherCampaign;
