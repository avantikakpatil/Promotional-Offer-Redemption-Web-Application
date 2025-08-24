import React, { useState, useEffect } from 'react';
import { Gift, Package, Calendar, QrCode, Download, RefreshCw, CheckCircle, XCircle, User, Tag, Clock } from 'lucide-react';
import { generateQRCodeDataURL } from '../../../utils/qrGenerator';

const VoucherRestrictedCampaign = ({ campaign, vouchers, onVoucherGenerated }) => {
  const [filter, setFilter] = useState('all');
  const [qrDataURLs, setQrDataURLs] = useState({});

  // Filter vouchers for this campaign
  const campaignVouchers = Array.isArray(vouchers)
    ? vouchers.filter(v => String(v.campaignId) === String(campaign.id))
    : [];

  useEffect(() => {
    const generateQRCodes = async () => {
      try {
        const qrImageMap = {};
        for (const voucher of campaignVouchers) {
          const qrData = voucher.qrCode && voucher.qrCode.trim()
            ? voucher.qrCode.trim()
            : voucher.voucherCode;
          if (qrData) {
            qrImageMap[voucher.voucherCode] = await generateQRCodeDataURL(qrData, {
              size: 300,
              margin: 2,
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
    if (voucher.isRedeemed) return { status: 'redeemed', color: 'bg-red-100 text-red-700', icon: XCircle };
    if (expiryDate < now) return { status: 'expired', color: 'bg-gray-100 text-gray-700', icon: Clock };
    return { status: 'active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
  };

  const filteredVouchers = campaignVouchers.filter(voucher => {
    if (filter === 'all') return true;
    const { status } = getVoucherStatus(voucher);
    return status === filter;
  });

  if (!vouchers) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div><span className="text-lg">Loading vouchers...</span></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 w-full mb-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <button onClick={onVoucherGenerated} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"><RefreshCw size={14} />Refresh</button>
        </div>
        {[{ key: 'all', label: 'All Vouchers', count: campaignVouchers.length }, { key: 'active', label: 'Active', count: campaignVouchers.filter(v => getVoucherStatus(v).status === 'active').length }, { key: 'redeemed', label: 'Redeemed', count: campaignVouchers.filter(v => getVoucherStatus(v).status === 'redeemed').length }, { key: 'expired', label: 'Expired', count: campaignVouchers.filter(v => getVoucherStatus(v).status === 'expired').length }].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-50 border'}`}>{label} ({count})</button>
        ))}
      </div>
      {/* Vouchers Grid (show eligible redemption products for each voucher) */}
      {/* ... */}
    </div>
  );
};
export default VoucherRestrictedCampaign;
