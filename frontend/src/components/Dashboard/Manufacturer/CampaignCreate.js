import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, Package, Target, Info, AlertCircle } from 'lucide-react';

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
    budget: '',
    targetAudience: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  // Configuration for API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5162';

  // Debug token and decode it on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT payload to see what claims are available
        const payload = JSON.parse(atob(token.split('.')[1]));
        const nameIdUri = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
        const roleUri = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        setTokenInfo({
          exists: true,
          claims: payload,
          hasUserId: !!payload.UserId || !!payload.nameid || !!payload.id || !!payload[nameIdUri],
          hasId: !!payload.id || !!payload.nameid || !!payload.UserId || !!payload[nameIdUri],
          hasRole: !!payload.role || !!payload[roleUri],
          userIdValue: payload.UserId || payload.id || payload.nameid || payload[nameIdUri] || 'Not found',
          role: payload.role || payload[roleUri] || payload[Object.keys(payload).find(key => key.toLowerCase().includes('role'))] || 'Not found'
        });
        
        console.log('Token payload:', payload);
        console.log('Available claims:', Object.keys(payload));
        console.log('UserId claim:', payload.UserId);
        console.log('id claim:', payload.id);
      } catch (error) {
        console.error('Error decoding token:', error);
        setTokenInfo({ exists: true, error: 'Invalid token format' });
      }
    } else {
      setTokenInfo({ exists: false });
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    // Name
    if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
    else if (formData.name.length < 3) newErrors.name = 'Campaign name must be at least 3 characters';
    else if (formData.name.length > 255) newErrors.name = 'Campaign name must be at most 255 characters';
    // ProductType
    if (!formData.productType) newErrors.productType = 'Product type is required';
    else if (formData.productType.length > 100) newErrors.productType = 'Product type must be at most 100 characters';
    // Points
    if (!formData.points || isNaN(formData.points) || parseInt(formData.points) <= 0) newErrors.points = 'Points must be a positive number';
    // Dates
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (start >= end) newErrors.endDate = 'End date must be after start date';
      if (start < today) newErrors.startDate = 'Start date cannot be in the past';
    }
    // Description
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    else if (formData.description.length > 1000) newErrors.description = 'Description must be at most 1000 characters';
    // Budget
    if (formData.budget && (isNaN(formData.budget) || parseFloat(formData.budget) < 0)) newErrors.budget = 'Budget must be a non-negative number';
    // TargetAudience
    if (formData.targetAudience && formData.targetAudience.length > 500) newErrors.targetAudience = 'Target audience must be at most 500 characters';
    // Reward Tiers
    if (!formData.rewardTiers || !formData.rewardTiers.length) newErrors.rewardTiers = 'At least one reward tier is required';
    formData.rewardTiers.forEach((tier, index) => {
      if (!tier.threshold || isNaN(tier.threshold) || parseInt(tier.threshold) <= 0) {
        newErrors[`tier_${index}_threshold`] = 'Threshold must be a positive number';
      }
      if (!tier.reward.trim()) {
        newErrors[`tier_${index}_reward`] = 'Reward description is required';
      } else if (tier.reward.length < 3) {
        newErrors[`tier_${index}_reward`] = 'Reward must be at least 3 characters';
      } else if (tier.reward.length > 500) {
        newErrors[`tier_${index}_reward`] = 'Reward must be at most 500 characters';
      }
    });
    // Check for duplicate thresholds
    const thresholds = formData.rewardTiers.map(t => parseInt(t.threshold));
    const hasDuplicates = thresholds.some((t, i) => thresholds.indexOf(t) !== i);
    if (hasDuplicates) newErrors.rewardTiers = 'Duplicate reward tier thresholds are not allowed';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRewardTierChange = (index, field, value) => {
    const newTiers = [...formData.rewardTiers];
    newTiers[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      rewardTiers: newTiers,
    }));
    // Clear tier-specific errors
    const errorKey = `tier_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
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
    // Clear errors for removed tier
    const newErrors = { ...errors };
    delete newErrors[`tier_${index}_threshold`];
    delete newErrors[`tier_${index}_reward`];
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // Check authentication before proceeding
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No authentication token found. Please log in again.');
      navigate('/login');
      return;
    }
    // Additional token validation
    if (tokenInfo && !tokenInfo.hasUserId && !tokenInfo.hasId) {
      alert('Invalid token: No user ID found. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      // Transform data to match backend DTO structure
      const campaignData = {
        name: formData.name,
        productType: formData.productType,
        points: parseInt(formData.points),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        targetAudience: formData.targetAudience || null,
        isActive: formData.isActive,
        rewardTiers: formData.rewardTiers.map(tier => ({
          threshold: parseInt(tier.threshold),
          reward: tier.reward
        }))
      };
      console.log('Sending campaign data:', campaignData);
      console.log('Token info:', tokenInfo);
      // API call to create campaign
      const response = await fetch(`${API_BASE_URL}/api/manufacturer/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignData)
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        // Try to parse error response
        const responseText = await response.text();
        console.log('Error response:', responseText);
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            // Handle validation errors
            if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.join(', ');
            }
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            errorMessage = `${errorMessage} - Response: ${responseText}`;
          }
        }
        throw new Error(errorMessage);
      }
      // Parse successful response
      const responseText = await response.text();
      let result;
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing success response:', parseError);
          result = { success: true, message: 'Campaign created successfully' };
        }
      } else {
        result = { success: true, message: 'Campaign created successfully' };
      }
      console.log('Campaign created:', result);
      // Navigate to dashboard on success
      alert('Campaign created successfully!');
      navigate('/manufacturer/dashboard');
    } catch (error) {
      console.error('Error creating campaign:', error);
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Network error: Unable to connect to server. Please check if the backend is running.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Authentication error: Your session has expired or token is invalid. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.message.includes('403')) {
        alert('Authorization error: You do not have permission to create campaigns.');
      } else if (error.message.includes('User ID not found in token')) {
        alert('Token Error: Your authentication token is missing required user information. This is likely a backend configuration issue. Please contact support or try logging in again.');
      } else {
        alert(`Error creating campaign: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const productTypes = [
    { value: 'milk', label: 'Milk Products' },
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
        </div>
        <p className="text-gray-600">Set up a new promotional campaign with reward tiers to engage your customers</p>
      </div>

      {/* Token Debug Info */}
      {tokenInfo && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">Token Debug Info</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">API URL:</span> {API_BASE_URL}</p>
            <p><span className="font-medium">Token Present:</span> {tokenInfo.exists ? 'Yes' : 'No'}</p>
            {tokenInfo.exists && !tokenInfo.error && (
              <>
                <p><span className="font-medium">User ID (UserId claim):</span> {tokenInfo.hasUserId ? '✅ Found' : '❌ Missing'}</p>
                <p><span className="font-medium">User ID (id claim):</span> {tokenInfo.hasId ? '✅ Found' : '❌ Missing'}</p>
                <p><span className="font-medium">Role:</span> {tokenInfo.role}</p>
                <p><span className="font-medium">User ID Value:</span> {tokenInfo.userIdValue}</p>
              </>
            )}
            {tokenInfo.error && (
              <p className="text-red-600"><span className="font-medium">Error:</span> {tokenInfo.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Token Warning */}
      {tokenInfo && tokenInfo.exists && !tokenInfo.hasUserId && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Token Issue Detected</span>
          </div>
          <div className="text-sm text-yellow-700">
            <p>Your token doesn't contain a "UserId" claim, which the backend expects.</p>
            <p>Available claims: {tokenInfo.claims ? Object.keys(tokenInfo.claims).join(', ') : 'Unknown'}</p>
            <p className="mt-2 font-medium">Backend Fix Required:</p>
            <ul className="ml-4 list-disc">
              <li>Change backend to look for "id" instead of "UserId", OR</li>
              <li>Change JWT generation to use "UserId" instead of "id"</li>
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-6">
            <Info className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter campaign name"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
                Product Type *
              </label>
              <select
                name="productType"
                id="productType"
                value={formData.productType}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.productType ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select product type</option>
                {productTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.productType && <p className="mt-1 text-sm text-red-600">{errors.productType}</p>}
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                Points Value *
              </label>
              <input
                type="number"
                name="points"
                id="points"
                value={formData.points}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.points ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Points per product"
                min="1"
                required
              />
              {errors.points && <p className="mt-1 text-sm text-red-600">{errors.points}</p>}
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                Budget (Optional)
              </label>
              <input
                type="number"
                name="budget"
                id="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Campaign budget"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                name="targetAudience"
                id="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Young families, Health-conscious consumers"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Description *
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your campaign goals and details..."
                required
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Activate campaign immediately after creation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Reward Tiers */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Reward Tiers</h2>
            </div>
            <button
              type="button"
              onClick={addRewardTier}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </button>
          </div>

          <div className="space-y-4">
            {formData.rewardTiers.map((tier, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Tier {index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeRewardTier(index)}
                      className="inline-flex items-center p-1 border border-transparent rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      title="Remove tier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Threshold (Points) *
                    </label>
                    <input
                      type="number"
                      value={tier.threshold}
                      onChange={(e) => handleRewardTierChange(index, 'threshold', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors[`tier_${index}_threshold`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Points required"
                      min="1"
                      required
                    />
                    {errors[`tier_${index}_threshold`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`tier_${index}_threshold`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reward Description *
                    </label>
                    <input
                      type="text"
                      value={tier.reward}
                      onChange={(e) => handleRewardTierChange(index, 'reward', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors[`tier_${index}_reward`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 10% discount, Free product"
                      required
                    />
                    {errors[`tier_${index}_reward`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`tier_${index}_reward`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/manufacturer/dashboard')}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignCreate;