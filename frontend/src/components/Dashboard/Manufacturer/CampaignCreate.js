import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, Package, Target, Info, AlertCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { productAPI } from '../../../services/api';

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
    voucherValue: '',
    voucherGenerationThreshold: '',
    voucherValidityDays: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [selectedEligibleProducts, setSelectedEligibleProducts] = useState([]);
  const [selectedVoucherProducts, setSelectedVoucherProducts] = useState([]);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [manufacturerProducts, setManufacturerProducts] = useState([]);

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
      setEligibleProducts([]);
      setSelectedEligibleProducts([]);
      setSelectedVoucherProducts([]);
      return;
    }
    async function fetchCategoryProducts() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dummy/products?category=${encodeURIComponent(formData.productType)}`);
        const data = await res.json();
        setCategoryProducts(data);
        setEligibleProducts(data); // for compatibility with rest of code
        setSelectedEligibleProducts([]); // reset selection on category change
        setSelectedVoucherProducts([]); // reset voucher selection on category change
      } catch (err) {
        setCategoryProducts([]);
        setEligibleProducts([]);
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
        const res = await fetch(`${API_BASE_URL}/api/manufacturer/product`);
        
        if (res.ok) {
          const data = await res.json();
          setManufacturerProducts(data);
        } else {
          console.error('Failed to fetch products:', res.status, res.statusText);
          setManufacturerProducts([]);
        }
      } catch (err) {
        console.error('Error fetching manufacturer products:', err);
        setManufacturerProducts([]);
      }
    }
    
    fetchManufacturerProducts();
  }, [API_BASE_URL]);

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
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        eligibleProducts: selectedEligibleProducts.map(ep => ({
          productId: ep.productId,
          pointCost: ep.pointCost ? parseInt(ep.pointCost) : 0,
          redemptionLimit: ep.redemptionLimit ? parseInt(ep.redemptionLimit) : null,
          isActive: ep.isActive
        })),
        voucherValue: parseFloat(formData.voucherValue),
        voucherGenerationThreshold: parseInt(formData.voucherGenerationThreshold),
        voucherValidityDays: parseInt(formData.voucherValidityDays)
      };

      if (!window.confirm('Are you sure you want to create this campaign?')) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/manufacturer/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignData)
      });

      if (response.ok) {
        alert('Campaign created successfully!');
        navigate('/manufacturer/campaigns');
      } else {
        const errorData = await response.json();
        console.error('Campaign creation failed:', errorData);
        alert(`Failed to create campaign: ${errorData.message || 'Unknown error'}`);
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

  // 1. Visually prominent stepper at the top
  const Stepper = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((stepObj, idx) => (
        <div key={stepObj.label} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg border-2 transition-all duration-200 
            ${step === idx ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-blue-600 border-blue-300'}`}
          >
            {idx + 1}
          </div>
          <span className={`ml-3 mr-6 text-base font-semibold ${step === idx ? 'text-blue-700' : 'text-gray-400'}`}>{stepObj.label}</span>
          {idx < steps.length - 1 && (
            <div className="w-10 h-1 bg-blue-200 rounded-full mx-2" />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200 mb-10">
            <h2 className="text-2xl font-bold text-blue-700 mb-2 flex items-center"><Info className="h-6 w-6 mr-2 text-blue-500" /> Basic Campaign Information</h2>
            <hr className="my-4 border-blue-200" />
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
                <p className="text-xs text-gray-500 mt-1">Value of the voucher to be redeemed.</p>
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
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200 mb-10">
            <h2 className="text-2xl font-bold text-blue-700 mb-2 flex items-center"><Package className="h-6 w-6 mr-2 text-blue-500" /> Product Selection for Campaign</h2>
            <hr className="my-4 border-blue-200" />
            <div className="mb-4 text-gray-500 text-sm">Select products from the chosen category and assign points for this campaign. <span className='text-blue-600'>(Step 2 of 2)</span></div>
            
            {/* Section 1: Available Products from Selected Category */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2 text-blue-600" />
                Available Products - {formData.productType || 'Select Category'}
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
                        <tr className="bg-gray-100 sticky top-0 z-10">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Select</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Brand</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryProducts.map((product, index) => {
                          const isSelected = selectedEligibleProducts.some(ep => ep.productId === product.id);
                          return (
                            <tr key={product.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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
                        <tr className="bg-green-100 sticky top-0 z-10">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Brand</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Points Per Purchase</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEligibleProducts.map((selectedProduct, index) => {
                          const product = categoryProducts.find(p => p.id === selectedProduct.productId);
                          return (
                            <tr key={selectedProduct.productId} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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
                                  className="text-red-600 font-bold flex items-center hover:text-red-800 text-sm"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" /> Remove
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
                Voucher Redemption Products (Your Products)
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
                        <tr className="bg-purple-100 sticky top-0 z-10">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Select</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manufacturerProducts.map((product, index) => {
                          const isSelected = selectedVoucherProducts.some(vp => vp.productId === product.id);
                          return (
                            <tr key={product.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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
                        <tr className="bg-purple-100 sticky top-0 z-10">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Base Price (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Voucher Value (₹)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVoucherProducts.map((selectedProduct, index) => {
                          const product = manufacturerProducts.find(p => p.id === selectedProduct.productId);
                          return (
                            <tr key={selectedProduct.productId} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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
                                  className="text-red-600 font-bold flex items-center hover:text-red-800 text-sm"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" /> Remove
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