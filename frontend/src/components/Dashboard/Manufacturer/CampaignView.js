import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI } from '../../../services/api';
import {
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  TagIcon,
  GiftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

const CampaignView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignProducts, setCampaignProducts] = useState([]);
  const [voucherProducts, setVoucherProducts] = useState([]);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const res = await campaignAPI.getCampaignById(id);
        if (res.data && res.data.data) {
          setCampaign(res.data.data);
          
          // Fetch campaign products details
          if (res.data.data.eligibleProducts && res.data.data.eligibleProducts.length > 0) {
            try {
              const campaignProductsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5162'}/api/campaign-products`);
              const campaignProductsData = await campaignProductsRes.json();
              setCampaignProducts(campaignProductsData);
            } catch (err) {
              console.error('Error fetching campaign products:', err);
            }
          }

          // Fetch voucher products details
          if (res.data.data.voucherProducts && res.data.data.voucherProducts.length > 0) {
            try {
              const voucherProductsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5162'}/api/manufacturer/products`);
              const voucherProductsData = await voucherProductsRes.json();
              setVoucherProducts(voucherProductsData.data || []);
            } catch (err) {
              console.error('Error fetching voucher products:', err);
            }
          }
        } else {
          setError('Campaign not found.');
        }
      } catch (err) {
        setError('Failed to fetch campaign.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [id]);

  const getStatusColor = (campaign) => {
    if (!campaign.isActive) return 'bg-gray-100 text-gray-800';
    if (new Date(campaign.endDate) < new Date()) return 'bg-red-100 text-red-800';
    if (new Date(campaign.startDate) > new Date()) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (campaign) => {
    if (!campaign.isActive) return 'Inactive';
    if (new Date(campaign.endDate) < new Date()) return 'Expired';
    if (new Date(campaign.startDate) > new Date()) return 'Upcoming';
    return 'Active';
  };

  const getProductName = (productId, productType) => {
    if (productType === 'campaign') {
      const product = campaignProducts.find(p => p.id === productId);
      return product ? product.name : `Product ID: ${productId}`;
    } else {
      const product = voucherProducts.find(p => p.id === productId);
      return product ? product.name : `Product ID: ${productId}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading campaign details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Campaign not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Campaigns
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaign Details</h1>
              <p className="text-gray-600 mt-2">Complete information about your campaign</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/manufacturer/campaign/${id}/edit`)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{campaign.name}</h2>
              <p className="text-gray-600 mt-2">{campaign.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign)}`}>
                {getStatusText(campaign)}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {campaign.productType}
              </span>
            </div>
          </div>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-sm text-gray-900">
                  {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CurrencyRupeeIcon className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Voucher Value</p>
                <p className="text-sm text-gray-900">₹{campaign.voucherValue || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TagIcon className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Points Threshold</p>
                <p className="text-sm text-gray-900">{campaign.voucherGenerationThreshold || 0} pts</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GiftIcon className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Voucher Validity</p>
                <p className="text-sm text-gray-900">{campaign.voucherValidityDays || 0} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Eligible Products */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-green-600" />
              Eligible Products (for Points Earning)
            </h3>
            {campaign.eligibleProducts && campaign.eligibleProducts.length > 0 ? (
              <div className="space-y-3">
                {campaign.eligibleProducts.map((product, index) => (
                  <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {getProductName(product.campaignProductId, 'campaign')}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Points per purchase:</span>
                        <span className="ml-2 font-medium text-gray-900">{product.pointCost}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Redemption limit:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {product.redemptionLimit || 'No limit'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No eligible products configured</p>
              </div>
            )}
          </div>

          {/* Voucher Products */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GiftIcon className="h-5 w-5 text-purple-600" />
              Voucher Products (for Redemption)
            </h3>
            {campaign.voucherProducts && campaign.voucherProducts.length > 0 ? (
              <div className="space-y-3">
                {campaign.voucherProducts.map((product, index) => (
                  <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {getProductName(product.productId, 'voucher')}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.isActive ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Voucher value:</span>
                      <span className="ml-2 font-medium text-gray-900">₹{product.voucherValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GiftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No voucher products configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate(`/manufacturer/analytics?campaignId=${id}`)}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Analytics</span>
            </button>

            <button
              onClick={() => navigate(`/manufacturer/qr-codes?campaignId=${id}`)}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCodeIcon className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">QR Codes</span>
            </button>

            <button
              onClick={() => navigate(`/manufacturer/assign-reseller?campaignId=${id}`)}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserGroupIcon className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Assign Resellers</span>
            </button>

            <button
              onClick={() => navigate(`/manufacturer/campaign/${id}/edit`)}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Edit Campaign</span>
            </button>
          </div>
        </div>

        {/* Campaign Statistics */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {campaign.eligibleProducts?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Eligible Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {campaign.voucherProducts?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Voucher Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {campaign.eligibleProducts?.reduce((sum, ep) => sum + (ep.pointCost || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₹{campaign.voucherProducts?.reduce((sum, vp) => sum + (vp.voucherValue || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Voucher Value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignView; 