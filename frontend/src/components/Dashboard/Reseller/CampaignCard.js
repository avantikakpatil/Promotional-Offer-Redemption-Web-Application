import React, { useState } from 'react';
import { Gift, Star, DollarSign, Calendar, QrCode, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle, User, Tag, Package, Clock, MapPin } from 'lucide-react';
import VoucherList from './VoucherList';

const CampaignCard = ({ campaign, voucherInfo, generateVoucher, generatingVoucher, getStatusColor, getButtonColor, getCannotGenerateReason, formatDate, allVouchers, allFreeProductVouchers }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState(null); // null, 'details', 'vouchers'

  const info = voucherInfo[campaign.id];
  const isFreeProductCampaign = campaign.rewardType === 'free_product';
  const isVoucherRestrictedCampaign = campaign.rewardType === 'voucher_restricted';

  const campaignVouchers = allVouchers.filter(v => v.campaignId === campaign.id);
  const campaignFreeProductVouchers = allFreeProductVouchers.filter(v => v.campaignId === campaign.id);

  const canGenerate = info?.voucherGeneration?.canGenerate || false;

  const renderGenerationUI = () => {
    if (isFreeProductCampaign) {
      const rules = info?.freeProductSettings?.rules || [];
      const vouchersCanGenerate = info?.voucherGeneration?.vouchersCanGenerate || 0;
      const freeProductCannotReason = !canGenerate ? (() => {
           const needs = rules.map(r => {
             const minQty = r.minPurchaseQuantity || 0;
             const purchased = r.totalUnitsPurchased || 0;
             if (minQty <= 0) return null;
             const remainder = purchased % minQty;
             const unitsNeeded = remainder === 0 ? minQty : (minQty - remainder);
             return {
               unitsNeeded,
               eligible: r.eligibleProduct?.name || 'eligible product',
               freeProduct: r.freeProduct?.name || 'free product',
               freeQty: r.freeProductQty || 1
             };
           }).filter(Boolean).sort((a,b) => a.unitsNeeded - b.unitsNeeded);
           if (needs.length === 0) return 'Place an order for eligible products to earn free products';
           const n = needs[0];
           return `You need ${n.unitsNeeded} more units of ${n.eligible} to earn ${n.freeQty} x ${n.freeProduct}`;
         })() : '';

      return (
        <div className="bg-blue-50 rounded-lg p-4">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-lg font-semibold text-gray-800 mb-2">
                   Free Product Generation
                 </h3>
                  {canGenerate ? (
                   <div className="space-y-2">
                     <p className="text-sm text-gray-600">
                       You can generate{' '}
                       <span className="font-semibold text-green-600">{vouchersCanGenerate}</span> free product voucher(s)
                     </p>
                   </div>
                   ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{freeProductCannotReason}</p>
                    </div>
                  )}
               </div>
               <button
                  onClick={() => generateVoucher(campaign.id)}
                  disabled={!canGenerate || generatingVoucher[campaign.id]}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${getButtonColor(canGenerate, true)}`}
                >
                 {generatingVoucher[campaign.id] ? (
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                 ) : (
                   <Package size={16} />
                 )}
                 {generatingVoucher[campaign.id] ? 'Generating...' : 'Generate Free Product'}
               </button>
             </div>
           </div>
      );
    } else if (isVoucherRestrictedCampaign) {
        const vouchersCanGenerate = info?.voucherGeneration?.vouchersCanGenerate || 0;
        const nextVoucherValue = info?.voucherGeneration?.nextVoucherValue || 0;
        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Voucher Generation</h3>
                        {canGenerate ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    You can generate{' '}
                                    <span className="font-semibold text-green-600">{vouchersCanGenerate}</span> voucher(s)
                                </p>
                                <p className="text-sm text-gray-600">
                                    Each voucher will be worth{' '}
                                    <span className="font-semibold text-green-600">₹{nextVoucherValue}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">{getCannotGenerateReason(info, false)}</p>
                                <p className="text-sm text-gray-600">
                                    Each voucher requires{' '}
                                    <span className="font-semibold text-red-600">{info.voucherSettings?.threshold}</span> points
                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => generateVoucher(campaign.id)}
                        disabled={!canGenerate || generatingVoucher[campaign.id]}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${getButtonColor(canGenerate, false)}`}
                    >
                        {generatingVoucher[campaign.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Gift size={16} />
                        )}
                        {generatingVoucher[campaign.id] ? 'Generating...' : 'Generate Voucher'}
                    </button>
                </div>
            </div>
        );
    } else {
        const vouchersCanGenerate = info?.voucherGeneration?.vouchersCanGenerate || 0;
        const nextVoucherValue = info?.voucherGeneration?.nextVoucherValue || 0;
        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Voucher Generation</h3>
                        {canGenerate ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    You can generate{' '}
                                    <span className="font-semibold text-green-600">{vouchersCanGenerate}</span> voucher(s)
                                </p>
                                <p className="text-sm text-gray-600">
                                    Each voucher will be worth{' '}
                                    <span className="font-semibold text-green-600">₹{nextVoucherValue}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">{getCannotGenerateReason(info, false)}</p>
                                <p className="text-sm text-gray-600">
                                    Each voucher requires{' '}
                                    <span className="font-semibold text-red-600">{info.voucherSettings?.threshold}</span> points
                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => generateVoucher(campaign.id)}
                        disabled={!canGenerate || generatingVoucher[campaign.id]}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${getButtonColor(canGenerate, false)}`}
                    >
                        {generatingVoucher[campaign.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Gift size={16} />
                        )}
                        {generatingVoucher[campaign.id] ? 'Generating...' : 'Generate Voucher'}
                    </button>
                </div>
            </div>
        );
    }
  };

  const renderDetails = () => {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{campaign.name}</h2>
            <p className="text-gray-600 mt-1">{campaign.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Manufacturer: {campaign.manufacturer?.name}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(canGenerate)}`}>
            {canGenerate ? `Can Generate` : 'Cannot Generate'}
          </span>
        </div>
        <div className="mt-6">
          {info?.voucherSettings?.isConfigured || isFreeProductCampaign ? (
            renderGenerationUI()
          ) : (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Voucher generation not configured
                  </p>
                  <p className="text-sm text-yellow-700">
                    The manufacturer has not set up voucher generation for this campaign.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVouchers = () => {
    return (
      <div className="p-6 bg-gray-50">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Your Vouchers for this Campaign</h3>
        <VoucherList vouchers={campaignVouchers} freeProductVouchers={campaignFreeProductVouchers} />
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border-l-4 ${isFreeProductCampaign ? 'border-blue-500' : 'border-green-500'}`}>
      <div className="p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="text-xl font-semibold text-gray-800">{campaign.name}</h2>
        <p className="text-gray-600 mt-1">{campaign.description}</p>
        <p className="text-sm text-gray-500 mt-1">
          Manufacturer: {campaign.manufacturer?.name}
        </p>
      </div>

      {isExpanded && (
        <div>
          <div className="flex justify-center p-4 border-t">
            <button
              onClick={() => setViewMode('details')}
              className={`px-4 py-2 mx-2 rounded-lg ${viewMode === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              View Details
            </button>
            <button
              onClick={() => setViewMode('vouchers')}
              className={`px-4 py-2 mx-2 rounded-lg ${viewMode === 'vouchers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              View Vouchers
            </button>
          </div>

          {viewMode === 'details' && renderDetails()}
          {viewMode === 'vouchers' && renderVouchers()}
        </div>
      )}
    </div>
  );
};

export default CampaignCard;
