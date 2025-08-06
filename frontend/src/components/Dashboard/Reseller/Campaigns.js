import React, { useState, useEffect } from 'react';
import { campaignAPI } from '../../../services/api';

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

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      // Use the public campaigns endpoint to get rewardTiers, just like manufacturer
      const response = await campaignAPI.getAllCampaigns();
      console.log('Campaigns response:', response); // Debug log
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
      
      // Fetch detailed campaign information
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
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        campaign.name?.toLowerCase().includes(searchLower) ||
        campaign.description?.toLowerCase().includes(searchLower) ||
        campaign.productType?.toLowerCase().includes(searchLower) ||
        campaign.manufacturer?.name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    // Apply status filter
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

  const getCategoryColor = (productType) => {
    switch (productType?.toLowerCase()) {
      case 'electronics':
        return 'bg-purple-100 text-purple-800';
      case 'education':
        return 'bg-indigo-100 text-indigo-800';
      case 'seasonal':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns by name, description, product type, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Status Filters */}
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
              <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => {
                  const now = new Date();
                  const startDate = new Date(c.startDate);
                  const endDate = new Date(c.endDate);
                  return c.isActive && startDate <= now && endDate >= now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {campaigns.filter(c => {
                  const now = new Date();
                  const startDate = new Date(c.startDate);
                  return c.isActive && startDate > now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {campaigns.filter(c => {
                  const now = new Date();
                  const endDate = new Date(c.endDate);
                  return endDate < now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Expired</div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {campaign.manufacturer?.name || 'Unknown Manufacturer'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign)}`}>
                    {getCampaignStatus(campaign)}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{campaign.description}</p>

                {/* Reward Tiers */}
                {Array.isArray(campaign.rewardTiers) && campaign.rewardTiers.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Reward Tiers:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {campaign.rewardTiers.map((tier, idx) => (
                        <li key={tier.id || idx} className="flex items-center gap-2">
                          <span className="inline-block bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-semibold">
                            Threshold: {tier.threshold} pts
                          </span>
                          <span className="inline-block bg-green-50 text-green-800 px-2 py-0.5 rounded">
                            {tier.reward}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Points per Unit</p>
                    <p className="text-lg font-semibold text-blue-600">{campaign.points}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Min Order Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      ₹{campaign.minimumOrderValue || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Voucher Settings */}
                {(campaign.voucherGenerationThreshold || campaign.voucherValue || campaign.voucherValidityDays) && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs font-semibold text-purple-700 mb-2">Voucher Settings:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {campaign.voucherGenerationThreshold && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600">Threshold:</span>
                          <span className="font-medium">{campaign.voucherGenerationThreshold} pts</span>
                        </div>
                      )}
                      {campaign.voucherValue && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600">Value:</span>
                          <span className="font-medium">₹{campaign.voucherValue}</span>
                        </div>
                      )}
                      {campaign.voucherValidityDays && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600">Validity:</span>
                          <span className="font-medium">{campaign.voucherValidityDays} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Campaign Products */}
                {(Array.isArray(campaign.eligibleProducts) || Array.isArray(campaign.voucherProducts)) && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Campaign Products:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.isArray(campaign.eligibleProducts) && campaign.eligibleProducts.length > 0 && (
                        <div className="p-2 bg-green-50 rounded">
                          <div className="text-xs font-medium text-green-700 mb-1">Eligible Products:</div>
                          <div className="text-xs text-green-600">
                            {campaign.eligibleProducts.length} product(s) for points earning
                          </div>
                        </div>
                      )}
                      {Array.isArray(campaign.voucherProducts) && campaign.voucherProducts.length > 0 && (
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="text-xs font-medium text-blue-700 mb-1">Voucher Products:</div>
                          <div className="text-xs text-blue-600">
                            {campaign.voucherProducts.length} product(s) for redemption
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.productType)}`}>
                    {campaign.productType}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Valid Period</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      alert(`Campaign Details:\n\nName: ${campaign.name}\nDescription: ${campaign.description}\nProduct Type: ${campaign.productType}\nPoints: ${campaign.points}\nStart Date: ${new Date(campaign.startDate).toLocaleDateString()}\nEnd Date: ${new Date(campaign.endDate).toLocaleDateString()}\nManufacturer: ${campaign.manufacturer?.name || 'Unknown'}\nStatus: ${getCampaignStatus(campaign)}`);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => showCampaignDetails(campaign)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => participateInCampaign(campaign.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={participating[campaign.id] || (campaign.assignment && campaign.assignment.isApproved)}
                  >
                    {campaign.assignment && campaign.assignment.isApproved ? 'Participating' : (participating[campaign.id] ? 'Joining...' : 'Participate')}
                  </button>
                </div>
              </div>
            </div>
          ))}
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

      {/* Success State */}
      {/* The successMsg state and its usage were removed, so this block is no longer needed. */}

      {/* Summary Stats */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => {
                  const now = new Date();
                  const startDate = new Date(c.startDate);
                  const endDate = new Date(c.endDate);
                  return c.isActive && startDate <= now && endDate >= now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {campaigns.filter(c => {
                  const now = new Date();
                  const startDate = new Date(c.startDate);
                  return c.isActive && startDate > now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {campaigns.filter(c => {
                  const now = new Date();
                  const endDate = new Date(c.endDate);
                  return endDate < now;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Expired</div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showDetailsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">{selectedCampaign.name}</h3>
                    <p className="text-gray-600 mb-4">{selectedCampaign.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Product Type:</span>
                        <p className="text-gray-600">{selectedCampaign.productType}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Manufacturer:</span>
                        <p className="text-gray-600">{selectedCampaign.manufacturer?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Start Date:</span>
                        <p className="text-gray-600">{new Date(selectedCampaign.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">End Date:</span>
                        <p className="text-gray-600">{new Date(selectedCampaign.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reward Tiers */}
                  {Array.isArray(selectedCampaign.rewardTiers) && selectedCampaign.rewardTiers.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">Reward Tiers</h4>
                      <div className="space-y-2">
                        {selectedCampaign.rewardTiers.map((tier, idx) => (
                          <div key={tier.id || idx} className="flex items-center justify-between p-3 bg-white rounded border">
                            <span className="font-medium text-blue-600">{tier.threshold} points</span>
                            <span className="text-gray-700">{tier.reward}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voucher Settings */}
                  {(selectedCampaign.voucherGenerationThreshold || selectedCampaign.voucherValue || selectedCampaign.voucherValidityDays) && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">Voucher Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedCampaign.voucherGenerationThreshold && (
                          <div>
                            <span className="font-medium text-purple-700">Generation Threshold:</span>
                            <p className="text-purple-600">{selectedCampaign.voucherGenerationThreshold} points</p>
                          </div>
                        )}
                        {selectedCampaign.voucherValue && (
                          <div>
                            <span className="font-medium text-purple-700">Voucher Value:</span>
                            <p className="text-purple-600">₹{selectedCampaign.voucherValue}</p>
                          </div>
                        )}
                        {selectedCampaign.voucherValidityDays && (
                          <div>
                            <span className="font-medium text-purple-700">Validity Period:</span>
                            <p className="text-purple-600">{selectedCampaign.voucherValidityDays} days</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Campaign Products */}
                  {(Array.isArray(selectedCampaign.eligibleProducts) || Array.isArray(selectedCampaign.voucherProducts)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.isArray(selectedCampaign.eligibleProducts) && selectedCampaign.eligibleProducts.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-green-800 mb-3">Eligible Products</h4>
                          <div className="space-y-2">
                            {selectedCampaign.eligibleProducts.map((product, idx) => (
                              <div key={product.id || idx} className="p-3 bg-white rounded border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-green-700">Product ID: {product.campaignProductId}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="text-sm text-green-600 mt-1">
                                  Points: {product.pointCost} | Limit: {product.redemptionLimit || 'No limit'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(selectedCampaign.voucherProducts) && selectedCampaign.voucherProducts.length > 0 && (
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-indigo-800 mb-3">Voucher Products</h4>
                          <div className="space-y-2">
                            {selectedCampaign.voucherProducts.map((product, idx) => (
                              <div key={product.id || idx} className="p-3 bg-white rounded border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-indigo-700">Product ID: {product.productId}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    product.isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="text-sm text-indigo-600 mt-1">
                                  Voucher Value: ₹{product.voucherValue}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reseller Assignment Status */}
                  {selectedCampaign.assignment && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-3">Your Participation Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-yellow-700">Status:</span>
                          <p className={`font-medium ${selectedCampaign.assignment.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                            {selectedCampaign.assignment.isApproved ? 'Approved' : 'Pending Approval'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">Total Points Earned:</span>
                          <p className="text-yellow-600">{selectedCampaign.assignment.totalPointsEarned || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">Total Order Value:</span>
                          <p className="text-yellow-600">₹{selectedCampaign.assignment.totalOrderValue || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">Vouchers Generated:</span>
                          <p className="text-yellow-600">{selectedCampaign.assignment.totalVouchersGenerated || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {Array.isArray(selectedCampaign.orders) && selectedCampaign.orders.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Your Recent Orders</h4>
                      <div className="space-y-2">
                        {selectedCampaign.orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <span className="font-medium text-gray-700">{order.orderNumber}</span>
                              <p className="text-sm text-gray-600">₹{order.totalAmount} | +{order.totalPointsEarned} points</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'approved' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns; 