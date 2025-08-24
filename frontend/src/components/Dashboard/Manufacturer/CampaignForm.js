import React, { useState, useEffect } from 'react';
import { productAPI } from '../../../services/api';

const CampaignForm = ({
  initialData = {},
  onSubmit,
  loading,
  errors = {},
  submitLabel = 'Create Campaign',
}) => {
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
    isActive: true,
    ...initialData,
  });
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [selectedEligibleProducts, setSelectedEligibleProducts] = useState(initialData.eligibleProducts || []);

  useEffect(() => {
    // Map eligibleProducts from initialData to the structure expected by the form
    if (initialData.eligibleProducts && Array.isArray(initialData.eligibleProducts)) {
      setSelectedEligibleProducts(
        initialData.eligibleProducts.map(ep => ({
          campaignProductId: ep.campaignProductId,
          productName: ep.productName,
          pointCost: ep.pointCost,
          redemptionLimit: ep.redemptionLimit,
          isActive: ep.isActive
        }))
      );
    } else {
      setSelectedEligibleProducts([]);
    }
    setFormData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await productAPI.getManufacturerProducts();
        setEligibleProducts(res.data);
      } catch (err) {
        setEligibleProducts([]);
      }
    }
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRewardTierChange = (index, field, value) => {
    const newTiers = [...formData.rewardTiers];
    newTiers[index][field] = value;
    setFormData((prev) => ({ ...prev, rewardTiers: newTiers }));
  };

  const addRewardTier = () => {
    setFormData((prev) => ({ ...prev, rewardTiers: [...prev.rewardTiers, { threshold: '', reward: '' }] }));
  };

  const removeRewardTier = (index) => {
    setFormData((prev) => ({ ...prev, rewardTiers: prev.rewardTiers.filter((_, i) => i !== index) }));
  };

  const handleEligibleProductChange = (campaignProductId, field, value) => {
    setSelectedEligibleProducts((prev) =>
      prev.map((ep) => (ep.campaignProductId === campaignProductId ? { ...ep, [field]: value } : ep))
    );
  };

  const handleEligibleProductSelect = (product, checked) => {
    if (checked) {
      setSelectedEligibleProducts((prev) => [
        ...prev,
        { campaignProductId: product.id, productName: product.name, pointCost: 1, redemptionLimit: '', isActive: true },
      ]);
    } else {
      setSelectedEligibleProducts((prev) => prev.filter((ep) => ep.campaignProductId !== product.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      points: parseInt(formData.points),
      budget: formData.budget ? parseFloat(formData.budget) : null,
      rewardTiers: formData.rewardTiers.map((tier) => ({
        threshold: parseInt(tier.threshold),
        reward: tier.reward,
      })),
      eligibleProducts: selectedEligibleProducts.map((ep) => ({
        campaignProductId: ep.campaignProductId,
        pointCost: ep.pointCost ? parseInt(ep.pointCost) : 0,
        redemptionLimit: ep.redemptionLimit ? parseInt(ep.redemptionLimit) : null,
        isActive: ep.isActive,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
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
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter campaign name"
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          {/* ...other fields (productType, points, dates, etc.) ... */}
        </div>
      </div>
      {/* Reward Tiers */}
      {/* ...reward tier UI, similar to CampaignCreate.js... */}
      {/* Eligible Products */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Eligible Products for Redemption</h3>
        <div className="border rounded p-4 bg-gray-50">
          {eligibleProducts.length === 0 ? (
            <div className="text-gray-500">No products found. Add products first.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Select</th>
                  <th className="px-2 py-1">Product Name</th>
                  <th className="px-2 py-1">Point Cost</th>
                  <th className="px-2 py-1">Redemption Limit</th>
                </tr>
              </thead>
              <tbody>
                {eligibleProducts.map((product) => {
                  const selected = selectedEligibleProducts.find((ep) => ep.campaignProductId === product.id);
                  return (
                    <tr key={product.id}>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={(e) => handleEligibleProductSelect(product, e.target.checked)}
                        />
                      </td>
                      <td className="px-2 py-1">{product.name}</td>
                      <td className="px-2 py-1">
                        {selected ? (
                          <input
                            type="number"
                            min="1"
                            value={selected.pointCost}
                            onChange={(e) => handleEligibleProductChange(product.id, 'pointCost', e.target.value)}
                            className="w-20 border rounded px-2 py-1"
                            required
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {selected ? (
                          <input
                            type="number"
                            min="1"
                            value={selected.redemptionLimit}
                            onChange={(e) => handleEligibleProductChange(product.id, 'redemptionLimit', e.target.value)}
                            className="w-20 border rounded px-2 py-1"
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;