// QRScanner.js - Enhanced version with detailed product form for voucher_restricted

import React, { useState } from 'react';
import { QrCode, Camera, AlertCircle, CheckCircle, Plus, Minus, Package } from 'lucide-react';
import axios from 'axios';
import QrScanner from 'react-qr-scanner';

const previewStyle = {
  height: 240,
  width: '100%',
  maxWidth: 400,
  margin: '0 auto',
};

const QRScanner = ({ onScan, onError, onRedeem }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [manualProducts, setManualProducts] = useState([{ 
    name: '', 
    quantity: 1, 
    value: 0,
    brand: '',
    description: '',
    category: '',
    sku: '',
    unitPrice: 0
  }]);

  const handleAddProduct = () => {
    setManualProducts([...manualProducts, { 
      name: '', 
      quantity: 1, 
      value: 0,
      brand: '',
      description: '',
      category: '',
      sku: '',
      unitPrice: 0
    }]);
  };

  const handleRemoveProduct = (index) => {
    const list = [...manualProducts];
    list.splice(index, 1);
    setManualProducts(list);
  };

  const handleManualProductChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...manualProducts];
    
    if (name === 'quantity' || name === 'value' || name === 'unitPrice') {
      list[index][name] = Number(value) || 0;
      // Auto-calculate total value when quantity or unit price changes
      if (name === 'quantity' || name === 'unitPrice') {
        list[index].value = (list[index].quantity || 0) * (list[index].unitPrice || 0);
      }
    } else {
      list[index][name] = value;
    }
    
    setManualProducts(list);
  };

  const handleQRScan = async (qrData) => {
    try {
      setError('');
      setSuccess('');
      setVoucher(null);
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (parseError) {
        parsedData = { qrCode: qrData };
      }
      const qrCodeToSend = parsedData.qrCode || parsedData.code || qrData;
      const response = await axios.post('/api/shopkeeper/redemption/validate-qr', {
        qrCode: qrCodeToSend,
        voucherCode: parsedData.voucherCode,
        campaignId: parsedData.campaignId,
        value: parsedData.value
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        const campaignId = response.data.campaignId || response.data.CampaignId || parsedData.campaignId;
        const rewardType = response.data.rewardType || response.data.RewardType;
        console.log('Campaign reward type:', rewardType);
        
        setVoucher({ ...response.data, qrCode: qrCodeToSend, campaignId, rewardType });
        setSelectedProducts([]);
        
        // Fetch eligible products for this campaign
        if (campaignId) {
          if (rewardType === 'voucher_restricted') {
            // For voucher_restricted, fetch products from API to show eligible products
            try {
              const prodRes = await axios.get(`/api/shopkeeper/campaigns/${campaignId}/campaignvoucherproducts`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              });
              console.log('Eligible products API response:', prodRes.data);
              if (Array.isArray(prodRes.data) && prodRes.data.length === 0) {
                setError('No eligible products found for this campaign. Please check campaign setup or contact admin.');
              }
              setEligibleProducts(prodRes.data || []);
              setSelectedProducts([]);
            } catch (e) {
              console.error('Eligible products API error:', e);
              setEligibleProducts([]);
              setError('Failed to fetch eligible products. Please try again or contact support.');
            }
          } else {
            // For regular voucher, we don't need to fetch products from API
            // The form for manual product entry will be shown
            setEligibleProducts([]);
            setSelectedProducts([]);
            setError('');
          }
        } else {
          setEligibleProducts([]);
          if (rewardType === 'voucher_restricted') {
            setError('No campaign ID found in voucher. Cannot fetch eligible products.');
          }
        }
        onScan && onScan(response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Failed to process QR code';
      setError(errorMessage);
      onError && onError(errorMessage);
    }
  };

  const validateManualProducts = () => {
    return manualProducts.every(p => 
      p.name.trim() && 
      p.quantity > 0 && 
      p.value >= 0 &&
      p.unitPrice >= 0
    );
  };

  const handleRedeem = async () => {
    if (!voucher) return;
    setRedeeming(true);
    setError('');
    setSuccess('');

    let payload = {
      qrCode: voucher.qrCode,
    };
    let redemptionValue = 0;

    try {
      if (voucher.rewardType === 'voucher_restricted') {
        if (!selectedProducts.length) {
          setError('Please select at least one product to redeem.');
          setRedeeming(false);
          return;
        }
        payload.selectedProductIds = selectedProducts.map(p => p.id || p.campaignProductId);
        redemptionValue = selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0);
      } else {
        if (!validateManualProducts()) {
          setError('Please enter valid product details. Name, quantity, and unit price are required for all products.');
          setRedeeming(false);
          return;
        }
        payload.redeemedManualProducts = manualProducts;
        redemptionValue = manualProducts.reduce((sum, p) => sum + (p.value || 0), 0);
      }

      if (redemptionValue > (voucher.voucherValue || voucher.pointsRequired)) {
        setError('Total value of redeemed products exceeds voucher value.');
        setRedeeming(false);
        return;
      }

      const response = await axios.post('/api/shopkeeper/redemption/redeem', payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setEligibleProducts([]);
      setSuccess('Voucher redeemed successfully!');
      setVoucher(null);
      setSelectedProducts([]);
      setManualProducts([{ 
        name: '', 
        quantity: 1, 
        value: 0,
        brand: '',
        description: '',
        category: '',
        sku: '',
        unitPrice: 0
      }]);
      onRedeem && onRedeem();
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Failed to redeem voucher';
      setError(errorMessage);
    } finally {
      setRedeeming(false);
    }
  };

  const getTotalManualProductsValue = () => {
    return manualProducts.reduce((sum, p) => sum + (p.value || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-4">
        <QrCode size={48} className="mx-auto mb-2 text-blue-600" />
        <h3 className="text-lg font-semibold">Scan Voucher QR Code</h3>
        <p className="text-gray-600 text-sm">Point your camera at the QR code to redeem</p>
      </div>
      
      <div className="scanner-area bg-gray-100 rounded-lg p-8 text-center">
        {scanning ? (
          <div className="space-y-4">
            <QrScanner
              delay={300}
              style={previewStyle}
              onError={err => {
                setError('Camera error: ' + (err?.message || err));
                setScanning(false);
                onError && onError(err);
              }}
              onScan={data => {
                if (data) {
                  setScanning(false);
                  handleQRScan(typeof data === 'string' ? data : data.text || data);
                }
              }}
              facingMode="environment"
            />
            <p className="text-blue-600">Scanning for QR code...</p>
            <button
              onClick={() => setScanning(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop Scanning
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Camera size={64} className="mx-auto text-gray-400" />
            <button
              onClick={() => setScanning(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Scanner
            </button>
          </div>
        )}
      </div>

      {/* Success Popup */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="font-medium">Success</span>
          </div>
          <p className="text-green-600 text-sm mt-1">{success}</p>
        </div>
      )}

      {/* Error Display */}
      {error && !(voucher?.rewardType === 'voucher' && typeof error === 'string' && error.includes('eligible products')) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{typeof error === 'object' ? JSON.stringify(error) : error}</p>
        </div>
      )}

      {/* Voucher Details and Redeem Button */}
      {voucher && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Voucher Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700 mb-4">
            <p>Campaign: <span className="font-semibold">{voucher.campaignName}</span></p>
            <p>Voucher Code: <span className="font-semibold">{voucher.voucherCode}</span></p>
            <p>Value: <span className="font-semibold">₹{voucher.voucherValue}</span></p>
            <p>Points Required: <span className="font-semibold">{voucher.pointsRequired}</span></p>
            <p>Expiry: <span className="font-semibold">{new Date(voucher.expiryDate).toLocaleString()}</span></p>
            <p>Campaign Type: <span className="font-semibold bg-blue-100 px-2 py-1 rounded">{voucher.rewardType || 'voucher'}</span></p>
          </div>
          
          {/* Conditional UI for product details based on rewardType */}
          {voucher.rewardType === 'voucher_restricted' ? (
            // For voucher_restricted, show eligible products from API
            eligibleProducts && eligibleProducts.length > 0 ? (
              <div className="mt-2">
                <p className="text-sm text-blue-700 font-medium mb-3">Select Product(s) to Redeem (Restricted Voucher):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eligibleProducts.map(product => {
                    const id = product.id || product.campaignProductId;
                    const name = product.name || product.productName;
                    const isSelected = selectedProducts.find(p => (p.id || p.campaignProductId) === id);
                    const disabled = !isSelected && (selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0) + (product.retailPrice || 0) > (voucher.voucherValue || voucher.pointsRequired));
                    
                    return (
                      <div
                        key={id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors shadow-sm hover:shadow-md ${
                          isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (disabled) return;
                          setSelectedProducts(prev => {
                            const already = prev.find(p => (p.id || p.campaignProductId) === id);
                            if (already) {
                              return prev.filter(p => (p.id || p.campaignProductId) !== id);
                            } else {
                              return [...prev, product];
                            }
                          });
                        }}
                      >
                        <div className="font-semibold text-lg mb-1">{name && name.trim()}</div>
                        <div className="text-sm text-gray-600 mb-1">
                          Price: <span className="font-bold">₹{product.retailPrice}</span>
                        </div>
                        {product.brand && <div className="text-xs text-gray-400 mb-1">Brand: {product.brand.trim()}</div>}
                        {product.description && <div className="text-xs text-gray-400 mb-1">{product.description.trim()}</div>}
                        {isSelected && <div className="text-xs text-blue-600 font-semibold mt-2">✓ Selected</div>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Total Value Used:</span>
                    <span>₹{selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0)} / ₹{voucher.voucherValue || voucher.pointsRequired}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No eligible products available for this restricted voucher.
              </div>
            )
          ) : (
            // For regular voucher, show manual product form
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-green-600" />
                <h5 className="font-medium text-green-800">Add Product Details Manually (Regular Voucher)</h5>
              </div>
              
              {manualProducts.map((product, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-green-200 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h6 className="font-medium text-gray-800">Product {index + 1}</h6>
                    {manualProducts.length > 1 && (
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                      >
                        <Minus size={16} />
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Product Name - Required */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter product name"
                        value={product.name}
                        onChange={(e) => handleManualProductChange(e, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Brand */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        name="brand"
                        placeholder="Enter brand"
                        value={product.brand}
                        onChange={(e) => handleManualProductChange(e, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        name="category"
                        placeholder="Enter category"
                        value={product.category}
                        onChange={(e) => handleManualProductChange(e, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU/Barcode</label>
                      <input
                        type="text"
                        name="sku"
                        placeholder="Enter SKU or barcode"
                        value={product.sku}
                        onChange={(e) => handleManualProductChange(e, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Quantity - Required */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        placeholder="Quantity"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => handleManualProductChange(e, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Unit Price - Required */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="unitPrice"
                        placeholder="Unit price"
                        min="0"
                        step="0.01"
                        value={product.unitPrice}
                        onChange={(e) => handleManualProductChange(e, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      placeholder="Enter product description (optional)"
                      value={product.description}
                      onChange={(e) => handleManualProductChange(e, index)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Auto-calculated Total Value */}
                  <div className="mt-3 p-2 bg-gray-50 rounded border">
                    <span className="text-sm font-medium text-gray-700">
                      Total Value: <span className="font-bold text-green-600">₹{product.value.toFixed(2)}</span>
                      {product.quantity > 0 && product.unitPrice > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({product.quantity} × ₹{product.unitPrice})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
              
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={16} />
                Add Another Product
              </button>
              
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-700">Total Value of All Products:</span>
                  <span className="text-green-600">₹{getTotalManualProductsValue().toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Voucher Value: ₹{(voucher.voucherValue || voucher.pointsRequired || 0).toFixed(2)}
                </div>
                {getTotalManualProductsValue() > (voucher.voucherValue || voucher.pointsRequired || 0) && (
                  <div className="text-sm text-red-600 mt-1 font-medium">
                    ⚠️ Total exceeds voucher value
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button
            onClick={handleRedeem}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              redeeming || 
              (voucher.rewardType === 'voucher_restricted' ? 
                (!selectedProducts.length || selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0) > (voucher.voucherValue || voucher.pointsRequired || 0))
                : (!validateManualProducts() || getTotalManualProductsValue() > (voucher.voucherValue || voucher.pointsRequired || 0))
              )
            }
          >
            {redeeming ? 'Redeeming...' : 'Redeem Voucher'}
          </button>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Manual Entry</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter QR code or voucher code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                handleQRScan(e.target.value.trim());
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.target.previousElementSibling;
              if (input.value.trim()) {
                handleQRScan(input.value.trim());
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;