import React from 'react';
import { Package, Calendar, RefreshCw, CheckCircle } from 'lucide-react';

const FreeProductCampaign = ({ campaign, freeProductVouchers, onVoucherGenerated }) => {
  // Filter free product vouchers for this campaign
  const campaignFreeProductVouchers = Array.isArray(freeProductVouchers)
    ? freeProductVouchers.filter(fpv => String(fpv.campaignId) === String(campaign.id))
    : [];

  if (!freeProductVouchers) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div><span className="text-lg">Loading free product vouchers...</span></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 w-full mb-2">
          <span className="text-sm font-medium text-gray-700">Free Product Vouchers</span>
          <button onClick={onVoucherGenerated} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"><RefreshCw size={14} />Refresh</button>
        </div>
      </div>
      {/* Free Product Vouchers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaignFreeProductVouchers.map(fpv => (
          <div key={fpv.id} className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">FREE PRODUCT VOUCHER</h3>
                  <p className="text-blue-100 text-sm">ID: {fpv.id}</p>
                </div>
                <Package className="text-blue-200" size={32} />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {fpv.freeProductQty} x {fpv.freeProduct?.name || `Product ${fpv.freeProductId}`}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Free: {fpv.freeProduct?.name || `Product ${fpv.freeProductId}`} ({fpv.freeProduct?.sku || 'N/A'})</div>
                  <div>Eligible: {fpv.eligibleProduct?.name || `Product ${fpv.eligibleProductId}`} ({fpv.eligibleProduct?.sku || 'N/A'})</div>
                </div>
              </div>
              {fpv.message && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Message:</div>
                  <div className="text-sm text-blue-700">{fpv.message}</div>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Campaign:</span>
                <span className="ml-1">{fpv.campaign?.name || `Campaign ${fpv.campaignId}`}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <Calendar className="mr-1" size={12} />
                <span>Created: {new Date(fpv.createdAt).toLocaleString('en-US')}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle size={12} />Active
              </div>
            </div>
          </div>
        ))}
      </div>
      {campaignFreeProductVouchers.length === 0 && (
        <div className="mt-10 text-center text-gray-500 py-12">
          <Package className="mx-auto mb-4 text-gray-400" size={64} />
          <p className="text-lg">No free product vouchers found for this campaign.</p>
        </div>
      )}
    </div>
  );
};
export default FreeProductCampaign;
