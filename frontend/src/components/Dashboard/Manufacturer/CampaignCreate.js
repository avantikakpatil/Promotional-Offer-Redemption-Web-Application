import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CampaignCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    productType: '',
    points: '',
    startDate: '',
    endDate: '',
    description: '',
    rewardTiers: [{ threshold: '', reward: '' }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRewardTierChange = (index, field, value) => {
    const newTiers = [...formData.rewardTiers];
    newTiers[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      rewardTiers: newTiers,
    }));
  };

  const addRewardTier = () => {
    setFormData((prev) => ({
      ...prev,
      rewardTiers: [...prev.rewardTiers, { threshold: '', reward: '' }],
    }));
  };

  const removeRewardTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      rewardTiers: prev.rewardTiers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement API call to create campaign
      console.log('Campaign data:', formData);
      navigate('/manufacturer/dashboard');
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Create New Campaign
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Campaign Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
              Product Type
            </label>
            <input
              type="text"
              name="productType"
              id="productType"
              value={formData.productType}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700">
              Points Value
            </label>
            <input
              type="number"
              name="points"
              id="points"
              value={formData.points}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Reward Tiers */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Reward Tiers</h2>
            <button
              type="button"
              onClick={addRewardTier}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Tier
            </button>
          </div>

          {formData.rewardTiers.map((tier, index) => (
            <div key={index} className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Threshold
                </label>
                <input
                  type="number"
                  value={tier.threshold}
                  onChange={(e) => handleRewardTierChange(index, 'threshold', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Reward
                </label>
                <input
                  type="text"
                  value={tier.reward}
                  onChange={(e) => handleRewardTierChange(index, 'reward', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeRewardTier(index)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Remove tier</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/manufacturer/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Campaign
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignCreate; 