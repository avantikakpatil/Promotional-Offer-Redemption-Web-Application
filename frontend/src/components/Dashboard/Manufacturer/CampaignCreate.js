import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Target, Info, AlertCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { productAPI, campaignAPI } from '../../../services/api';

const steps = [
  { label: 'Basic Info' },
  { label: 'Eligible Products' },
];

const CampaignCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    productType: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
    voucherValue: '',
    voucherGenerationThreshold: '',
    voucherValidityDays: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedEligibleProducts, setSelectedEligibleProducts] = useState([]);
  const [selectedVoucherProducts, setSelectedVoucherProducts] = useState([]);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [manufacturerProducts, setManufacturerProducts] = useState([]);

  // Configuration for API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5162';



  // Fetch categories for Product Type dropdown
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dummy/categories`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setCategories([]);
      }
    }
    fetchCategories();
  }, [API_BASE_URL]);

  // Fetch products for selected category (for points earning)
  useEffect(() => {
    if (!formData.productType) {
      setCategoryProducts([]);
      setSelectedEligibleProducts([]);
      setSelectedVoucherProducts([]);
      return;
    }
    async function fetchCategoryProducts() {
      try {
                       // Fetch all campaign products from the backend
               const res = await fetch(`${API_BASE_URL}/api/campaign-products`);
        const data = await res.json();
        // Filter by selected category
        const filtered = data.filter(p => p.category === formData.productType);
        setCategoryProducts(filtered);
        setSelectedEligibleProducts([]); // reset selection on category change
        setSelectedVoucherProducts([]); // reset voucher selection on category change
      } catch (err) {
        setCategoryProducts([]);
        setSelectedEligibleProducts([]);
        setSelectedVoucherProducts([]);
      }
    }
    fetchCategoryProducts();
  }, [formData.productType, API_BASE_URL]);

  // Fetch manufacturer's products (for voucher redemption)
  useEffect(() => {
    async function fetchManufacturerProducts() {
      try {
        const res = await productAPI.getManufacturerProducts();
        setManufacturerProducts(res.data);
      } catch (err) {
        console.error('Error fetching manufacturer products:', err);
        setManufacturerProducts([]);
      }
    }
    
    fetchManufacturerProducts();
  }, [API_BASE_URL]);

  // Add a helper to check for overlap between selectedEligibleProducts and selectedVoucherProducts
  const getOverlappingProductIds = () => {
    const eligibleIds = new Set(selectedEligibleProducts.map(ep => ep.productId));
    const voucherIds = new Set(selectedVoucherProducts.map(vp => vp.productId));
    return [...eligibleIds].filter(id => voucherIds.has(id));
  };

  const validateForm = () => {
    const newErrors = {};
    // Name
    if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
    else if (formData.name.length < 3) newErrors.name = 'Campaign name must be at least 3 characters';
    else if (formData.name.length > 255) newErrors.name = 'Campaign name must be at most 255 characters';
    // ProductType
    if (!formData.productType) newErrors.productType = 'Product type is required';
    else if (formData.productType.length > 100) newErrors.productType = 'Product type must be at most 100 characters';
    // Dates
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) newErrors.endDate = 'End date must be after start date';
    }
    // Description
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    else if (formData.description.length > 1000) newErrors.description = 'Description must be at most 1000 characters';
    // Eligible Products
    if (!selectedEligibleProducts || selectedEligibleProducts.length === 0) {
      newErrors.eligibleProducts = 'At least one eligible product must be selected';
    }
    // Voucher fields
    if (!formData.voucherValue || isNaN(formData.voucherValue) || parseFloat(formData.voucherValue) <= 0) newErrors.voucherValue = 'Voucher value is required and must be positive';
    if (!formData.voucherGenerationThreshold || isNaN(formData.voucherGenerationThreshold) || parseInt(formData.voucherGenerationThreshold) <= 0) newErrors.voucherGenerationThreshold = 'Voucher generation threshold is required and must be positive';
    if (!formData.voucherValidityDays || isNaN(formData.voucherValidityDays) || parseInt(formData.voucherValidityDays) <= 0) newErrors.voucherValidityDays = 'Voucher validity days is required and must be positive';
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

  const handleEligibleProductChange = (productId, field, value) => {
    setSelectedEligibleProducts((prev) =>
      prev.map((ep) =>
        ep.productId === productId ? { ...ep, [field]: value } : ep
      )
    );
  };
  const handleEligibleProductSelect = (product, checked) => {
    if (checked) {
      setSelectedEligibleProducts((prev) => [
        ...prev,
        { productId: product.id, productName: product.name, pointCost: '', redemptionLimit: '', isActive: true },
      ]);
    } else {
      setSelectedEligibleProducts((prev) => prev.filter((ep) => ep.productId !== product.id));
    }
  };

  const handleVoucherProductSelect = (product, checked) => {
    if (checked) {
      setSelectedVoucherProducts((prev) => [
        ...prev,
        { productId: product.id, productName: product.name, voucherValue: '', isActive: true },
      ]);
    } else {
      setSelectedVoucherProducts((prev) => prev.filter((vp) => vp.productId !== product.id));
    }
  };

  const handleVoucherProductChange = (productId, field, value) => {
    setSelectedVoucherProducts((prev) =>
      prev.map((vp) =>
        vp.productId === productId ? { ...vp, [field]: value } : vp
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter out invalid products before submission
    const validEligibleProductIds = new Set(categoryProducts.map(p => p.id)); // campaignproducts table
    const validVoucherProductIds = new Set(manufacturerProducts.map(p => p.id)); // products table
    const filteredEligibleProducts = selectedEligibleProducts.filter(ep => validEligibleProductIds.has(ep.productId));
    const filteredVoucherProducts = selectedVoucherProducts.filter(vp => validVoucherProductIds.has(vp.productId));

    if (filteredEligibleProducts.length !== selectedEligibleProducts.length || filteredVoucherProducts.length !== selectedVoucherProducts.length) {
      alert('One or more selected products are no longer available. Please review your selections.');
      return;
    }

    // Warn if the same product is selected for both eligible and voucher
    const overlap = getOverlappingProductIds();
    if (overlap.length > 0) {
      if (!window.confirm('Warning: The following product IDs are selected for both earning points and voucher redemption: ' + overlap.join(', ') + '. This is allowed, but please confirm you want to proceed.')) {
        return;
      }
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const campaignData = {
        name: formData.name,
        productType: formData.productType,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        description: formData.description,
        isActive: formData.isActive,
        eligibleProducts: filteredEligibleProducts.length > 0 ? filteredEligibleProducts.map(ep => ({
          campaignProductId: ep.productId, // from campaignproducts table
          pointCost: ep.pointCost ? parseInt(ep.pointCost) : 0,
          redemptionLimit: ep.redemptionLimit ? parseInt(ep.redemptionLimit) : null,
          isActive: ep.isActive
        })) : undefined,
        voucherProducts: filteredVoucherProducts.length > 0 ? filteredVoucherProducts.map(vp => ({
          productId: vp.productId, // from products table
          voucherValue: vp.voucherValue ? parseFloat(vp.voucherValue) : 0,
          isActive: vp.isActive
        })) : undefined,
        voucherValue: formData.voucherValue ? parseFloat(formData.voucherValue) : null,
        voucherGenerationThreshold: formData.voucherGenerationThreshold ? parseInt(formData.voucherGenerationThreshold) : null,
        voucherValidityDays: formData.voucherValidityDays ? parseInt(formData.voucherValidityDays) : null
      };

      const response = await campaignAPI.createCampaign(campaignData);

      if (response.status === 200 || response.status === 201) {
        alert('Campaign created successfully!');
        navigate('/manufacturer/campaigns');
      } else {
        console.error('Campaign creation failed:', response.data);
        alert(`Failed to create campaign: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(`Error creating campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0) {
      // Validate basic info
      const basicInfoErrors = {};
      if (!formData.name.trim()) basicInfoErrors.name = 'Campaign name is required';
      if (!formData.productType) basicInfoErrors.productType = 'Product type is required';
      if (!formData.startDate) basicInfoErrors.startDate = 'Start date is required';
      if (!formData.endDate) basicInfoErrors.endDate = 'End date is required';
      if (!formData.description.trim()) basicInfoErrors.description = 'Description is required';
      if (!formData.voucherValue || isNaN(formData.voucherValue) || parseFloat(formData.voucherValue) <= 0) basicInfoErrors.voucherValue = 'Voucher value is required and must be positive';
      if (!formData.voucherGenerationThreshold || isNaN(formData.voucherGenerationThreshold) || parseInt(formData.voucherGenerationThreshold) <= 0) basicInfoErrors.voucherGenerationThreshold = 'Voucher generation threshold is required and must be positive';
      if (!formData.voucherValidityDays || isNaN(formData.voucherValidityDays) || parseInt(formData.voucherValidityDays) <= 0) basicInfoErrors.voucherValidityDays = 'Voucher validity days is required and must be positive';
      
      if (Object.keys(basicInfoErrors).length > 0) {
        setErrors(basicInfoErrors);
        return;
      }
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const Stepper = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {steps.map((stepItem, index) => (
  <div key={index} className="flex items-center">
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
        index <= step
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-gray-300 text-gray-500'
      }`}
    >
      {index < step ? <CheckCircle className="w-5 h-5" /> : index + 1}
    </div>

            <span className={`ml-2 text-sm font-medium ${
              index <= step ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {stepItem.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 ml-4 ${
                index < step ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <Info className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Campaign Information</h2>
            </div>
            <div className="mb-4 text-gray-500 text-sm">Fill in the basic details for your campaign. <span className='text-blue-600'>(Step 1 of 2)</span></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
                  placeholder="e.g., Summer Sale Campaign"
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type (Category) *</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.productType ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.productType && <p className="mt-1 text-sm text-red-600">{errors.productType}</p>}
              </div>



              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>



              <div>
                <label htmlFor="voucherValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Value (₹) *
                </label>
                <input
                  type="number"
                  name="voucherValue"
                  id="voucherValue"
                  value={formData.voucherValue}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.voucherValue ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 100"
                  min="0.01"
                  step="0.01"
                  required
                />
                {errors.voucherValue && <p className="mt-1 text-sm text-red-600">{errors.voucherValue}</p>}
              </div>

              <div>
                <label htmlFor="voucherGenerationThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Generation Threshold (Points) *
                </label>
                <input
                  type="number"
                  name="voucherGenerationThreshold"
                  id="voucherGenerationThreshold"
                  value={formData.voucherGenerationThreshold}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.voucherGenerationThreshold ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 50"
                  min="1"
                  required
                />
                {errors.voucherGenerationThreshold && <p className="mt-1 text-sm text-red-600">{errors.voucherGenerationThreshold}</p>}
              </div>

              <div>
                <label htmlFor="voucherValidityDays" className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Validity (Days) *
                </label>
                <input
                  type="number"
                  name="voucherValidityDays"
                  id="voucherValidityDays"
                  value={formData.voucherValidityDays}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.voucherValidityDays ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 30"
                  min="1"
                  required
                />
                {errors.voucherValidityDays && <p className="mt-1 text-sm text-red-600">{errors.voucherValidityDays}</p>}
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Campaign</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Product Selection for Campaign</h3>
            <div className="mb-4 text-gray-500 text-sm">Select products from the chosen category and assign points for this campaign. <span className='text-blue-600'>(Step 2 of 2)</span></div>
            
            {/* Section 1: Available Products from Selected Category */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2 text-blue-600" />
                Available Products (for Points Earning, from Campaign Products Table) - {formData.productType || 'Select Category'}
              </h4>
              <div className="border rounded p-4 bg-gray-50">
                {!formData.productType ? (
                  <div className="text-gray-500 text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>Please select a Product Type (Category) in Step 1 to view available products.</p>
                  </div>
                ) : categoryProducts.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No products found for the selected category: <strong>{formData.productType}</strong></p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Select</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Brand</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryProducts.map((product) => {
                          const isSelected = selectedEligibleProducts.some(ep => ep.productId === product.id);
                          return (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => handleEligibleProductSelect(product, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900">{product.name}</td>
                              <td className="px-3 py-2 text-gray-600">{product.brand || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono text-xs">{product.sku || '-'}</td>
                              <td className="px-3 py-2 text-gray-600">₹{product.basePrice || 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Selected Eligible Products with Points Assignment */}
            {selectedEligibleProducts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Selected Products for Campaign ({selectedEligibleProducts.length})
                </h4>
                <div className="border rounded p-4 bg-green-50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Brand</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Points Per Purchase</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEligibleProducts.map((selectedProduct) => {
                          const product = categoryProducts.find(p => p.id === selectedProduct.productId);
                          return (
                            <tr key={selectedProduct.productId} className="border-b hover:bg-green-100">
                              <td className="px-3 py-2 font-medium text-gray-900">{product?.name || 'Unknown Product'}</td>
                              <td className="px-3 py-2 text-gray-600">{product?.brand || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono text-xs">{product?.sku || '-'}</td>
                              <td className="px-3 py-2 text-gray-600">₹{product?.basePrice || 0}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={selectedProduct.pointCost || ''}
                                  onChange={e => handleEligibleProductChange(selectedProduct.productId, 'pointCost', e.target.value)}
                                  className="w-24 px-2 py-1 border rounded text-sm"
                                  placeholder="Points"
                                  min="0"
                                  required
                                />
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => handleEligibleProductSelect(product, false)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Voucher Redemption Products */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                Voucher Redemption Products (from Products Table)
              </h4>
              <div className="mb-4 text-gray-500 text-sm">Select products from your managed products that can be redeemed using vouchers generated from this campaign.</div>
              
              <div className="border rounded p-4 bg-purple-50">
                {manufacturerProducts.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No products found in your managed products. Please add products in the Manage Products page first.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-purple-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Select</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manufacturerProducts.map((product) => {
                          const isSelected = selectedVoucherProducts.some(vp => vp.productId === product.id);
                          return (
                            <tr key={product.id} className="border-b hover:bg-purple-100">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => handleVoucherProductSelect(product, e.target.checked)}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  disabled={!product.isActive}
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900">{product.name}</td>
                              <td className="px-3 py-2 text-gray-600">{product.category || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono text-xs">{product.sku || '-'}</td>
                              <td className="px-3 py-2 text-gray-600">₹{product.basePrice || 0}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  product.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Selected Voucher Redemption Products */}
            {selectedVoucherProducts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-600" />
                  Selected Voucher Redemption Products ({selectedVoucherProducts.length})
                </h4>
                <div className="border rounded p-4 bg-purple-50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-purple-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Voucher Value (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVoucherProducts.map((selectedProduct) => {
                          const product = manufacturerProducts.find(p => p.id === selectedProduct.productId);
                          return (
                            <tr key={selectedProduct.productId} className="border-b hover:bg-purple-100">
                              <td className="px-3 py-2 font-medium text-gray-900">{product?.name || 'Unknown Product'}</td>
                              <td className="px-3 py-2 text-gray-600">{product?.category || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono text-xs">{product?.sku || '-'}</td>
                              <td className="px-3 py-2 text-gray-600">₹{product?.basePrice || 0}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={selectedProduct.voucherValue || ''}
                                  onChange={e => handleVoucherProductChange(selectedProduct.productId, 'voucherValue', e.target.value)}
                                  className="w-24 px-2 py-1 border rounded text-sm"
                                  placeholder="₹"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => handleVoucherProductSelect(product, false)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Section */}
            {(selectedEligibleProducts.length > 0 || selectedVoucherProducts.length > 0) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Campaign Summary</h4>
                <div className="text-sm text-blue-800">
                  {selectedEligibleProducts.length > 0 && (
                    <p>• <strong>{selectedEligibleProducts.length}</strong> product(s) selected for campaign points</p>
                  )}
                  {selectedVoucherProducts.length > 0 && (
                    <p>• <strong>{selectedVoucherProducts.length}</strong> product(s) selected for voucher redemption</p>
                  )}
                  {selectedEligibleProducts.length > 0 && (
                    <p>• Total points to assign: <strong>{selectedEligibleProducts.reduce((sum, ep) => sum + (ep.pointCost || 0), 0)}</strong></p>
                  )}
                  {selectedVoucherProducts.length > 0 && (
                    <p>• Total voucher value: <strong>₹{selectedVoucherProducts.reduce((sum, vp) => sum + (vp.voucherValue || 0), 0)}</strong></p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Tip: Products can be selected for both points earning and voucher redemption.
                  </p>
                </div>
              </div>
            )}

            {errors.eligibleProducts && <p className="mt-2 text-sm text-red-600">{errors.eligibleProducts}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  const renderNavButtons = () => (
    <div className="flex justify-between mt-8">
      <button
        type="button"
        onClick={prevStep}
        disabled={step === 0}
        className={`flex items-center px-6 py-2 border rounded-lg font-medium transition-colors ${
          step === 0
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Previous
      </button>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => navigate('/manufacturer/campaigns')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        {step === steps.length - 1 ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/manufacturer/campaigns')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-2">Set up a new promotional campaign for your products</p>
        </div>

        <Stepper />
        {renderStep()}
        {renderNavButtons()}
      </div>
    </div>
  );
};

export default CampaignCreate;