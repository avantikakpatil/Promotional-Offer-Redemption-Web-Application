import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  UserGroupIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

const ViewCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/manufacturer/campaigns');
      if (response.data.success) {
        setCampaigns(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch campaigns');
      }
    } catch (err) {
      setError('Failed to fetch campaigns: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (campaignId) => {
    try {
      await api.patch(`/manufacturer/campaigns/${campaignId}/toggle-status`);
      await fetchCampaigns(); // Refresh the list
    } catch (err) {
      alert('Failed to toggle campaign status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    if (!window.confirm(`Are you sure you want to delete the campaign "${campaignName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/manufacturer/campaigns/${campaignId}`);
      await fetchCampaigns(); // Refresh the list
    } catch (err) {
      alert('Failed to delete campaign: ' + (err.response?.data?.message || err.message));
    }
  };

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

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      // Filter by status
      if (filter === 'active' && (!campaign.isActive || new Date(campaign.endDate) < new Date() || new Date(campaign.startDate) > new Date())) return false;
      if (filter === 'inactive' && campaign.isActive) return false;
      if (filter === 'expired' && new Date(campaign.endDate) >= new Date()) return false;
      if (filter === 'upcoming' && new Date(campaign.startDate) <= new Date()) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          campaign.name.toLowerCase().includes(searchLower) ||
          campaign.productType.toLowerCase().includes(searchLower) ||
          campaign.description.toLowerCase().includes(searchLower) ||
          campaign.targetAudience?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">View Campaigns</h1>
            <p className="text-gray-600 mt-2">Manage and monitor all your promotional campaigns</p>
          </div>
          <Link
            to="/manufacturer/campaign/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Campaign
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns by name, product type, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Campaigns</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="upcoming">Upcoming</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Sort by Created Date</option>
              <option value="name">Sort by Name</option>
              <option value="points">Sort by Points</option>
              <option value="startDate">Sort by Start Date</option>
              <option value="endDate">Sort by End Date</option>
              <option value="budget">Sort by Budget</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {campaign.description}
                      </div>
                      {campaign.targetAudience && (
                        <div className="text-xs text-gray-400">
                          Target: {campaign.targetAudience}
                        </div>
                      )}
                      {/* Reward Tiers */}
                      {Array.isArray(campaign.rewardTiers) && campaign.rewardTiers.length > 0 && (
                        <div className="mt-2">
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {campaign.productType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.points} pts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Start: {new Date(campaign.startDate).toLocaleDateString()}</div>
                      <div>End: {new Date(campaign.endDate).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.budget ? `₹${campaign.budget.toLocaleString()}` : 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign)}`}>
                      {getStatusText(campaign)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* View Details */}
                      <Link
                        to={`/manufacturer/campaign/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>

                      {/* Edit Campaign */}
                      <Link
                        to={`/manufacturer/campaign/${campaign.id}/edit`}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit Campaign"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>

                      {/* Analytics */}
                      <Link
                        to={`/manufacturer/analytics?campaignId=${campaign.id}`}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        title="View Analytics"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </Link>

                      {/* QR Codes */}
                      <Link
                        to={`/manufacturer/qr-codes?campaignId=${campaign.id}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Manage QR Codes"
                      >
                        <QrCodeIcon className="h-4 w-4" />
                      </Link>

                      {/* Assign Resellers */}
                      <Link
                        to={`/manufacturer/assign-reseller?campaignId=${campaign.id}`}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title="Assign Resellers"
                      >
                        <UserGroupIcon className="h-4 w-4" />
                      </Link>

                      {/* Toggle Status */}
                      <button
                        onClick={() => handleToggleStatus(campaign.id)}
                        className={`p-1 ${
                          campaign.isActive 
                            ? 'text-yellow-600 hover:text-yellow-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={campaign.isActive ? 'Pause Campaign' : 'Activate Campaign'}
                      >
                        {campaign.isActive ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Delete Campaign */}
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Campaign"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAndSortedCampaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filter !== 'all' 
                ? 'No campaigns match your current filters.' 
                : 'You haven\'t created any campaigns yet.'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Link
                to="/manufacturer/campaign/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Your First Campaign
              </Link>
            )}
          </div>
        )}
      </div>

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
                {campaigns.filter(c => c.isActive && new Date(c.startDate) <= new Date() && new Date(c.endDate) >= new Date()).length}
              </div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {campaigns.filter(c => c.isActive && new Date(c.startDate) > new Date()).length}
              </div>
              <div className="text-sm text-gray-600">Upcoming Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {campaigns.filter(c => new Date(c.endDate) < new Date()).length}
              </div>
              <div className="text-sm text-gray-600">Expired Campaigns</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCampaigns; 