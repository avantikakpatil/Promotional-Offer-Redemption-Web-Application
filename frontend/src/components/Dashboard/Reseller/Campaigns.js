import React, { useState, useEffect } from 'react';
import { campaignAPI } from '../../../services/api';

const Campaigns = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participating, setParticipating] = useState({}); // { [campaignId]: true/false }
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleParticipate = async (campaignId) => {
    setParticipating((prev) => ({ ...prev, [campaignId]: true }));
    setSuccessMsg('');
    setError('');
    try {
      const response = await campaignAPI.participateInCampaign(campaignId);
      if (response.data && response.data.success) {
        setSuccessMsg(response.data.message || 'Participation successful!');
        // Optionally, refresh campaigns or update UI to reflect participation
      } else {
        setError(response.data?.message || 'Failed to participate.');
      }
    } catch (err) {
      let errorMessage = 'Failed to participate.';
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Network error: Unable to connect to server.';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setParticipating((prev) => ({ ...prev, [campaignId]: false }));
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
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMsg}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns; 