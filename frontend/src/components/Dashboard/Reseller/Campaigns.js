import React, { useState, useEffect } from 'react';
import { campaignAPI } from '../../../services/api';
import api from '../../../services/api';

const Campaigns = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [participating, setParticipating] = useState({});
  const [productMap, setProductMap] = useState({});

  // Fetch all campaign products and build a map of id -> name, sku, brand
  const fetchAllProducts = async () => {
    try {
      const response = await api.get('/campaign-products');
      if (Array.isArray(response.data)) {
        const map = {};
        response.data.forEach(p => {
          map[p.id] = p.name;
          map[p.id + '_sku'] = p.sku;
          map[p.id + '_brand'] = p.brand;
        });
        setProductMap(map);
      } else if (Array.isArray(response.data.products)) {
        const map = {};
        response.data.products.forEach(p => {
          map[p.id] = p.name;
          map[p.id + '_sku'] = p.sku;
          map[p.id + '_brand'] = p.brand;
        });
        setProductMap(map);
      }
    } catch (err) {
      setProductMap({});
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchAllProducts();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await campaignAPI.getAllCampaigns();
      console.log('Campaigns response:', response);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setCampaigns(response.data.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setCampaigns(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCampaigns(response.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      let errorMessage = 'Failed to fetch campaigns.';
      if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'Network error: Unable to connect to server. Please check if the backend is running.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const showCampaignDetails = async (campaign) => {
    try {
      setDetailsLoading(true);
      setSelectedCampaign(campaign);
      setShowDetailsModal(true);
      
      const response = await campaignAPI.getCampaignDetails(campaign.id);
      if (response.data) {
        setSelectedCampaign(response.data);
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      alert('Failed to fetch campaign details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const participateInCampaign = async (campaignId) => {
    setParticipating(prev => ({ ...prev, [campaignId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reseller/campaigns/${campaignId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Successfully participated in the campaign!');
        fetchCampaigns();
      } else {
        alert(data.message || 'Failed to participate in campaign.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setParticipating(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        campaign.name?.toLowerCase().includes(searchLower) ||
        campaign.description?.toLowerCase().includes(searchLower) ||
        campaign.productType?.toLowerCase().includes(searchLower) ||
        campaign.manufacturer?.name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    if (filter === 'all') return true;
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    if (filter === 'active') {
      return campaign.isActive && startDate <= now && endDate >= now;
    } else if (filter === 'upcoming') {
      return campaign.isActive && startDate > now;
    } else if (filter === 'expired') {
      return endDate < now;
    }
    return true;
  });

  // Separate campaigns by type
  const freeProductCampaigns = filteredCampaigns.filter(campaign => 
    campaign.rewardType === 'free_product' || 
    (campaign.eligibleProducts && campaign.eligibleProducts.some(p => p.freeProductId))
  );

  const voucherCampaigns = filteredCampaigns.filter(campaign => 
    campaign.rewardType === 'voucher' || 
    campaign.voucherGenerationThreshold || 
    campaign.voucherValue ||
    (campaign.voucherProducts && campaign.voucherProducts.length > 0)
  );

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    if (!campaign.isActive) return 'Inactive';
    if (startDate > now) return 'Upcoming';
    if (endDate < now) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (campaign) => {
    const status = getCampaignStatus(campaign);
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const CampaignCard = ({ campaign, type }) => (
    <div className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{campaign.name}</h3>
            <p className="text-sm text-gray-600 mb-2">by {campaign.manufacturer?.name || 'Unknown Manufacturer'}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign)}`}>
                {getCampaignStatus(campaign)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                type === 'free_product' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {type === 'free_product' ? 'Free Product' : 'Voucher'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => showCampaignDetails(campaign)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
          <button 
            onClick={() => participateInCampaign(campaign.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={participating[campaign.id] || (campaign.assignment && campaign.assignment.isApproved)}
          >
            {campaign.assignment && campaign.assignment.isApproved ? 'Participating' : (participating[campaign.id] ? 'Joining...' : 'Participate')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Available Campaigns</h1>
            <p className="text-gray-600 mt-2">Browse and participate in manufacturer campaigns to earn points</p>
          </div>
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns by name, description, product type, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Campaigns
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'expired' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Summary */}
      {!loading && !error && campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredCampaigns.length}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{freeProductCampaigns.length}</div>
              <div className="text-sm text-gray-600">Free Product Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{voucherCampaigns.length}</div>
              <div className="text-sm text-gray-600">Voucher Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredCampaigns.filter(c => {
                  const now = new Date();
                  const startDate = new Date(c.startDate);
                  const endDate = new Date(c.endDate);
                  return c.isActive && startDate <= now && endDate >= now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
          </div>
        </div>
      )}

      {/* Free Product Campaigns */}
      {!loading && !error && freeProductCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Free Product Campaigns</h2>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
              {freeProductCampaigns.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeProductCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} type="free_product" />
            ))}
          </div>
        </div>
      )}

      {/* Voucher Campaigns */}
      {!loading && !error && voucherCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Voucher Campaigns</h2>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
              {voucherCampaigns.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voucherCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} type="voucher" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCampaigns.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No campaigns found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'There are no campaigns available at the moment.' 
              : `There are no ${filter} campaigns matching your current filter.`
            }
          </p>
          {campaigns.length === 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Manufacturers may create new campaigns soon. Check back later!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading campaigns</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button 
                  onClick={fetchCampaigns}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showDetailsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Campaign Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCampaign(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading campaign details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Campaign Info */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-3">{selectedCampaign.name}</h3>
                    <p className="text-gray-600 mb-6">{selectedCampaign.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Product Type:</span>
                        <p className="text-gray-600">{selectedCampaign.productType}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Manufacturer:</span>
                        <p className="text-gray-600">{selectedCampaign.manufacturer?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Start Date:</span>
                        <p className="text-gray-600">{new Date(selectedCampaign.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">End Date:</span>
                        <p className="text-gray-600">{new Date(selectedCampaign.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Points per Unit:</span>
                        <p className="text-gray-600">{selectedCampaign.points}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Min Order Value:</span>
                        <p className="text-gray-600">₹{selectedCampaign.minimumOrderValue || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Campaign Type:</span>
                        <p className="text-gray-600">{selectedCampaign.rewardType || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 block mb-1">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCampaign)}`}>
                          {getCampaignStatus(selectedCampaign)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reward Tiers */}
                  {Array.isArray(selectedCampaign.rewardTiers) && selectedCampaign.rewardTiers.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h4 className="text-xl font-semibold text-blue-800 mb-4">Reward Tiers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedCampaign.rewardTiers.map((tier, idx) => (
                          <div key={tier.id || idx} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                            <span className="font-medium text-blue-600">Threshold: {tier.threshold} points</span>
                            <span className="text-gray-700 font-medium">{tier.reward}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voucher Settings */}
                  {(selectedCampaign.voucherGenerationThreshold || selectedCampaign.voucherValue || selectedCampaign.voucherValidityDays) && (
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h4 className="text-xl font-semibold text-purple-800 mb-4">Voucher Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {selectedCampaign.voucherGenerationThreshold && (
                          <div>
                            <span className="font-medium text-purple-700 block mb-1">Generation Threshold:</span>
                            <p className="text-purple-600 text-lg font-semibold">{selectedCampaign.voucherGenerationThreshold} points</p>
                          </div>
                        )}
                        {selectedCampaign.voucherValue && (
                          <div>
                            <span className="font-medium text-purple-700 block mb-1">Voucher Value:</span>
                            <p className="text-purple-600 text-lg font-semibold">₹{selectedCampaign.voucherValue}</p>
                          </div>
                        )}
                        {selectedCampaign.voucherValidityDays && (
                          <div>
                            <span className="font-medium text-purple-700 block mb-1">Validity Period:</span>
                            <p className="text-purple-600 text-lg font-semibold">{selectedCampaign.voucherValidityDays} days</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Eligible Products */}
                  {Array.isArray(selectedCampaign.eligibleProducts) && selectedCampaign.eligibleProducts.length > 0 && (
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h4 className="text-xl font-semibold text-green-800 mb-4">
                        Eligible Products ({selectedCampaign.eligibleProducts.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedCampaign.eligibleProducts.map((product, idx) => (
                          <div key={product.id || idx} className="p-4 bg-white rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h5 className="font-medium text-green-700 text-lg">
                                  {productMap[product.campaignProductId] || `Product ID: ${product.campaignProductId}`}
                                </h5>
                                {productMap[product.campaignProductId + '_sku'] && (
                                  <p className="text-sm text-gray-600 mt-1">SKU: {productMap[product.campaignProductId + '_sku']}</p>
                                )}
                                {productMap[product.campaignProductId + '_brand'] && (
                                  <p className="text-sm text-gray-600">Brand: {productMap[product.campaignProductId + '_brand']}</p>
                                )}
                              </div>
                              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                                product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Points Cost:</span>
                                <p className="text-green-600 font-semibold">{product.pointCost}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Redemption Limit:</span>
                                <p className="text-green-600 font-semibold">{product.redemptionLimit || 'No limit'}</p>
                              </div>
                              {product.minPurchaseQuantity !== undefined && product.minPurchaseQuantity !== null && (
                                <div>
                                  <span className="font-medium text-gray-700">Min Purchase Qty:</span>
                                  <p className="text-green-600 font-semibold">{product.minPurchaseQuantity}</p>
                                </div>
                              )}
                              {product.freeProductQty !== undefined && product.freeProductQty !== null && (
                                <div>
                                  <span className="font-medium text-gray-700">Free Qty:</span>
                                  <p className="text-green-600 font-semibold">{product.freeProductQty}</p>
                                </div>
                              )}
                            </div>

                            {product.freeProductId && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                                <h6 className="font-medium text-yellow-800 mb-1">Free Product Reward:</h6>
                                <p className="text-yellow-700">
                                  {productMap[product.freeProductId] || `Product ID: ${product.freeProductId}`}
                                </p>
                                {productMap[product.freeProductId + '_sku'] && (
                                  <p className="text-sm text-yellow-600">SKU: {productMap[product.freeProductId + '_sku']}</p>
                                )}
                                {productMap[product.freeProductId + '_brand'] && (
                                  <p className="text-sm text-yellow-600">Brand: {productMap[product.freeProductId + '_brand']}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voucher Products */}
                  {Array.isArray(selectedCampaign.voucherProducts) && selectedCampaign.voucherProducts.length > 0 && (
                    <div className="bg-indigo-50 p-6 rounded-lg">
                      <h4 className="text-xl font-semibold text-indigo-800 mb-4">
                        Voucher Products ({selectedCampaign.voucherProducts.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCampaign.voucherProducts.map((product, idx) => (
                          <div key={product.id || idx} className="p-4 bg-white rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h5 className="font-medium text-indigo-700 text-lg">
                                  {productMap[product.productId] || `Product ID: ${product.productId}`}
                                </h5>
                                {productMap[product.productId + '_sku'] && (
                                  <p className="text-sm text-gray-600 mt-1">SKU: {productMap[product.productId + '_sku']}</p>
                                )}
                                {productMap[product.productId + '_brand'] && (
                                  <p className="text-sm text-gray-600">Brand: {productMap[product.productId + '_brand']}</p>
                                )}
                              </div>
                              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                                product.isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Voucher Value:</span>
                              <p className="text-indigo-600 font-semibold text-lg">₹{product.voucherValue}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participation Status */}
                  {selectedCampaign.assignment && (
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h4 className="text-xl font-semibold text-yellow-800 mb-4">Your Participation Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <span className="font-medium text-yellow-700 block mb-1">Status:</span>
                          <p className={`font-semibold text-lg ${selectedCampaign.assignment.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                            {selectedCampaign.assignment.isApproved ? 'Approved' : 'Pending Approval'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 block mb-1">Total Points Earned:</span>
                          <p className="text-yellow-600 font-semibold text-lg">{selectedCampaign.assignment.totalPointsEarned || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 block mb-1">Total Order Value:</span>
                          <p className="text-yellow-600 font-semibold text-lg">₹{selectedCampaign.assignment.totalOrderValue || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700 block mb-1">Vouchers Generated:</span>
                          <p className="text-yellow-600 font-semibold text-lg">{selectedCampaign.assignment.totalVouchersGenerated || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {Array.isArray(selectedCampaign.orders) && selectedCampaign.orders.length > 0 && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-xl font-semibold text-gray-800 mb-4">Your Recent Orders</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Order Number</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Points Earned</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedCampaign.orders.slice(0, 10).map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-700">{order.orderNumber}</td>
                                <td className="px-4 py-3 text-gray-600">₹{order.totalAmount}</td>
                                <td className="px-4 py-3 text-green-600 font-semibold">+{order.totalPointsEarned}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'approved' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t">
                    <button 
                      onClick={() => participateInCampaign(selectedCampaign.id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      disabled={participating[selectedCampaign.id] || (selectedCampaign.assignment && selectedCampaign.assignment.isApproved)}
                    >
                      {selectedCampaign.assignment && selectedCampaign.assignment.isApproved ? 'Already Participating' : (participating[selectedCampaign.id] ? 'Joining...' : 'Participate in Campaign')}
                    </button>
                    <button 
                      onClick={() => {
                        setShowDetailsModal(false);
                        setSelectedCampaign(null);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      )}
    </div>
  );
};

export default Campaigns;