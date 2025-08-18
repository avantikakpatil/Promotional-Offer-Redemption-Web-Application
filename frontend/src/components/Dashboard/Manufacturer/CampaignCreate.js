import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Target, Info, AlertCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { productAPI, campaignAPI } from '../../../services/api';

const CampaignCreate = () => {
  const navigate = useNavigate();
  // 1. Add rewardType to formData state
  const [formData, setFormData] = useState({
    name: '',
    productType: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
    voucherValue: '',
    voucherGenerationThreshold: '',
    voucherValidityDays: '',
    rewardType: 'voucher', // default
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedEligibleProducts, setSelectedEligibleProducts] = useState([]);
  const [selectedVoucherProducts, setSelectedVoucherProducts] = useState([]);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [manufacturerProducts, setManufacturerProducts] = useState([]);
  // 2. Add state for free product rewards
  // const [selectedFreeProducts, setSelectedFreeProducts] = useState([]); // Removed

  // Move steps definition here
  const steps = [
    { label: 'Basic Info' },
    { label: 'Eligible Products' },
  ];

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

  // 4. Update validateForm to check required fields based on rewardType
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Campaign name is required';
    if (!formData.productType) newErrors.productType = 'Product type is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') {
      if (!formData.voucherValue) newErrors.voucherValue = 'Voucher value is required';
      if (!formData.voucherGenerationThreshold) newErrors.voucherGenerationThreshold = 'Voucher generation threshold is required';
      if (!formData.voucherValidityDays) newErrors.voucherValidityDays = 'Voucher validity days is required';
    }
    if (formData.rewardType === 'voucher_restricted' && selectedVoucherProducts.length === 0) {
      newErrors.voucherProducts = 'Select at least one voucher redemption product';
    }
    selectedEligibleProducts.forEach(ep => {
      if (ep.freeProductId) {
        if (!ep.minPurchaseQuantity || ep.minPurchaseQuantity < 1) {
          newErrors[`minPurchaseQuantity_${ep.productId}`] = 'Min purchase quantity must be at least 1';
        }
        if (!ep.freeProductQty || ep.freeProductQty < 1) {
          newErrors[`freeProductQty_${ep.productId}`] = 'Free product quantity must be at least 1';
        }
      }
    });
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
        { productId: product.id, productName: product.name, pointCost: '', redemptionLimit: '', isActive: true, minPurchaseQuantity: '', freeProductId: '', freeProductQty: '' },
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

  // 3. Add handler for free product selection and quantity
  // const handleFreeProductSelect = (product, checked) => { // Removed
  //   if (checked) {
  //     setSelectedFreeProducts((prev) => [
  //       ...prev,
  //       {
  //         productId: product.id,
  //         productName: product.name,
  //         quantity: 1,
  //         triggerQuantity: 1,
  //         triggerProductIds: selectedEligibleProducts.map(ep => ep.productId), // default: all eligible
  //         isActive: true
  //       },
  //     ]);
  //   } else {
  //     setSelectedFreeProducts((prev) => prev.filter((fp) => fp.productId !== product.id));
  //   }
  // };
  // const handleFreeProductChange = (productId, field, value) => { // Removed
  //   setSelectedFreeProducts((prev) =>
  //     prev.map((fp) =>
  //       fp.productId === productId ? { ...fp, [field]: value } : fp
  //     )
  //   );
  // };

  // Add handler for selecting trigger campaign products for a free product
  // const handleTriggerProductSelect = (freeProductId, campaignProductId, checked) => { // Removed
  //   setSelectedFreeProducts((prev) =>
  //     prev.map(fp =>
  //       fp.productId === freeProductId
  //         ? {
  //             ...fp,
  //             triggerProductIds: checked
  //               ? [...(fp.triggerProductIds || []), campaignProductId]
  //               : (fp.triggerProductIds || []).filter(id => id !== campaignProductId)
  //         }
  //       : fp
  //   )
  // );

  // 5. Update handleSubmit to send correct payload
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
        rewardType: formData.rewardType,
        eligibleProducts: filteredEligibleProducts.length > 0 ? filteredEligibleProducts.map(ep => ({
          campaignProductId: ep.productId, // from campaignproducts table
          pointCost: ep.pointCost ? parseInt(ep.pointCost) : 0,
          redemptionLimit: ep.redemptionLimit ? parseInt(ep.redemptionLimit) : null,
          isActive: ep.isActive,
          minPurchaseQuantity: ep.minPurchaseQuantity ? parseInt(ep.minPurchaseQuantity) : null,
          freeProductId: ep.freeProductId ? parseInt(ep.freeProductId) : null,
          freeProductQty: ep.freeProductId ? parseInt(ep.freeProductQty) : null,
        })) : undefined,
        voucherProducts: (formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') && filteredVoucherProducts.length > 0 ? filteredVoucherProducts.map(vp => ({
          productId: vp.productId, // from products table
          voucherValue: vp.voucherValue ? parseFloat(vp.voucherValue) : 0,
          isActive: vp.isActive
        })) : undefined,
        voucherValue: (formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') ? (formData.voucherValue ? parseFloat(formData.voucherValue) : null) : undefined,
        voucherGenerationThreshold: (formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') ? (formData.voucherGenerationThreshold ? parseInt(formData.voucherGenerationThreshold) : null) : undefined,
        voucherValidityDays: (formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') ? (formData.voucherValidityDays ? parseInt(formData.voucherValidityDays) : null) : undefined,
        freeProductRewards: formData.rewardType === 'free_product' && filteredEligibleProducts.some(ep => ep.freeProductId)
          ? filteredEligibleProducts.filter(ep => ep.freeProductId).map(ep => ({
              productId: parseInt(ep.freeProductId),
              quantity: ep.freeProductQty ? parseInt(ep.freeProductQty) : 1,
              isActive: true,
            }))
          : undefined,
      };
      console.log('Submitting campaign payload:', campaignData);

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
      if (error.response && error.response.data) {
        const data = error.response.data;
        console.error('Server response:', data);
        alert(`[${error.response.status}] ${data.message || 'Request failed'}${Array.isArray(data.errors) && data.errors.length ? '\n- ' + data.errors.join('\n- ') : ''}`);
      } else {
        alert(`Error creating campaign: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Adjust nextStep and prevStep to respect dynamic steps
  const nextStep = () => {
    if (step === 0) {
      // Basic info validation before moving to Step 2
      const basicInfoErrors = {};
      if (!formData.name) basicInfoErrors.name = 'Campaign name is required';
      if (!formData.productType) basicInfoErrors.productType = 'Product type is required';
      if (!formData.startDate) basicInfoErrors.startDate = 'Start date is required';
      if (!formData.endDate) basicInfoErrors.endDate = 'End date is required';
      if (!formData.description) basicInfoErrors.description = 'Description is required';
      if (formData.rewardType === 'voucher') {
        if (!formData.voucherValue) basicInfoErrors.voucherValue = 'Voucher value is required';
        if (!formData.voucherGenerationThreshold) basicInfoErrors.voucherGenerationThreshold = 'Voucher generation threshold is required';
        if (!formData.voucherValidityDays) basicInfoErrors.voucherValidityDays = 'Voucher validity days is required';
      }
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

  // 4. In renderStep, only show Step 1 for free_product, both steps for voucher
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <Info className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Campaign Information</h2>
            </div>
            <div className="mb-4 text-gray-500 text-sm">Fill in the basic details for your campaign. <span className='text-blue-600'>(Step 1 of {steps.length})</span></div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type *</label>
              <div className="flex space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="rewardType"
                    value="voucher"
                    checked={formData.rewardType === 'voucher'}
                    onChange={handleInputChange}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Voucher (₹)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="rewardType"
                    value="voucher_restricted"
                    checked={formData.rewardType === 'voucher_restricted'}
                    onChange={handleInputChange}
                    className="form-radio text-purple-600"
                  />
                  <span className="ml-2">Voucher (Restricted Redemption)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="rewardType"
                    value="free_product"
                    checked={formData.rewardType === 'free_product'}
                    onChange={handleInputChange}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2">Free Product(s)</span>
                </label>
              </div>
              {errors.rewardType && <p className="mt-1 text-sm text-red-600">{errors.rewardType}</p>}
            </div>
            
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



              {/* Conditionally render voucher fields for voucher and voucher_restricted */}
              {(formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') && (
                <>
                  <div>
                    <label htmlFor="voucherValue" className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.rewardType === 'voucher' ? 'Voucher Value (₹) *' : 'Voucher Value (Points) *'}
                    </label>
                    <input
                      type="number"
                      name="voucherValue"
                      id="voucherValue"
                      value={formData.voucherValue}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.voucherValue ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder={formData.rewardType === 'voucher' ? 'e.g., 100' : 'e.g., 1000'}
                      min="1"
                      step="1"
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
                </>
              )}

              {/* Conditionally render free product selection if rewardType is free_product */}
              {/* Free product configuration is handled per eligible product in Step 2 */}

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
            <div className="mb-4 text-gray-500 text-sm">Select products and configure based on reward type. <span className='text-blue-600'>(Step 2 of 2)</span></div>
            
            {/* Section 1: Available Products from Selected Category (both types) */}
            {(
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-600" />
                  Available Products (from Campaign Products Table) - {formData.productType || 'Select Category'}
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
                            {/* No price column here; this is points-based selection */}
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
                                {/* No price cell */}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 2: Selected Eligible Products with Assignment (both types) */}
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
                          {/* No price column; points-based earning */}
                          {/* Points for voucher; Buy X Get Y for free_product */}
                          {(formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') && (
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Points Per Purchase</th>
                          )}
                          {formData.rewardType === 'free_product' && (
                            <>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Min Purchase Qty</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Free Product</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Free Product Qty</th>
                            </>
                          )}
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
                              {/* No price cell */}
                              {(formData.rewardType === 'voucher' || formData.rewardType === 'voucher_restricted') && (
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
                              )}
                              {formData.rewardType === 'free_product' && (
                                <>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={selectedProduct.minPurchaseQuantity || ''}
                                      onChange={e => handleEligibleProductChange(selectedProduct.productId, 'minPurchaseQuantity', e.target.value)}
                                      className="w-20 px-2 py-1 border rounded text-sm"
                                      placeholder="Min Qty"
                                      min="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <select
                                      value={selectedProduct.freeProductId || ''}
                                      onChange={e => handleEligibleProductChange(selectedProduct.productId, 'freeProductId', e.target.value)}
                                      className="w-32 px-2 py-1 border rounded text-sm"
                                    >
                                      <option value="">Select Free Product</option>
                                      {manufacturerProducts.map(fp => (
                                        <option key={fp.id} value={fp.id}>{fp.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={selectedProduct.freeProductQty || ''}
                                      onChange={e => handleEligibleProductChange(selectedProduct.productId, 'freeProductQty', e.target.value)}
                                      className="w-20 px-2 py-1 border rounded text-sm"
                                      placeholder="Free Qty"
                                      min="1"
                                    />
                                  </td>
                                </>
                              )}
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

            {/* Voucher redemption products (only for voucher_restricted) */}
            {formData.rewardType === 'voucher_restricted' && (
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-600" />
                  Voucher Redemption Products (from Products Table)
                </h4>
                <div className="mb-4 text-gray-500 text-sm">Select products that vouchers from this campaign can be redeemed against.</div>
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
                {selectedVoucherProducts.length > 0 && (
                  <div className="mt-6 border rounded p-4 bg-purple-50">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-purple-600" />
                      Selected Voucher Redemption Products ({selectedVoucherProducts.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-purple-100">
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Required Points</th>
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
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={selectedProduct.voucherValue || ''}
                                    onChange={e => handleVoucherProductChange(selectedProduct.productId, 'voucherValue', e.target.value)}
                                    className="w-28 px-2 py-1 border rounded text-sm"
                                    placeholder="Points"
                                    min="1"
                                    step="1"
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
                )}
                {errors.voucherProducts && <p className="mt-2 text-sm text-red-600">{errors.voucherProducts}</p>}
              </div>
            )}

            {/* Summary Section */}
            {(selectedEligibleProducts.length > 0) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Campaign Summary</h4>
                <div className="text-sm text-blue-800">
                  <p>• <strong>{selectedEligibleProducts.length}</strong> product(s) selected for campaign</p>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 For voucher campaigns, assign points per product. For free product campaigns, configure Buy X Get Y.
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

  // 3. In renderNavButtons, show 'Create Campaign' on step 0 if rewardType is free_product
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
        {(step === steps.length - 1) ? (
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