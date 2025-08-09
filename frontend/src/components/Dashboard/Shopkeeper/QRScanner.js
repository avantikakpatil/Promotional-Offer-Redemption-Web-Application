// QRScanner.js - Updated to handle the new QR format


import React, { useState } from 'react';
import { QrCode, Camera, AlertCircle, CheckCircle } from 'lucide-react';
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
        setVoucher({ ...response.data, qrCode: qrCodeToSend, campaignId });
        setSelectedProducts([]); // reset selection on new scan
        // Fetch eligible products for this campaign
        // ...existing code...
        // Fetch eligible products for this campaign
        if (campaignId) {
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
          setEligibleProducts([]);
          setError('No campaign ID found in voucher. Cannot fetch eligible products.');
        }
        onScan && onScan(response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Failed to process QR code';
      setError(errorMessage);
      onError && onError(errorMessage);
    }
  };

  const handleRedeem = async () => {
    if (!voucher) return;
    setRedeeming(true);
    setError('');
    setSuccess('');
    try {
      if (!selectedProducts.length) {
        setError('Please select at least one product to redeem.');
        setRedeeming(false);
        return;
      }
      // Calculate total value
      const totalValue = selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0);
      if (totalValue > (voucher.voucherValue || voucher.pointsRequired)) {
        setError('Selected products exceed voucher value.');
        setRedeeming(false);
        return;
      }
      const response = await axios.post('/api/shopkeeper/redemption/redeem', {
        QRCode: voucher.qrCode,
        SelectedProductIds: selectedProducts.map(p => p.id || p.campaignProductId)
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setEligibleProducts([]);
      setSuccess('Voucher redeemed successfully!');
      setVoucher(null);
      setSelectedProducts([]);
      onRedeem && onRedeem(); // trigger parent to refresh history
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Failed to redeem voucher';
      setError(errorMessage);
    } finally {
      setRedeeming(false);
    }
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
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
      {/* Voucher Details and Redeem Button */}
      {voucher && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Voucher Details</h4>
          <p className="text-sm text-blue-700">Campaign: {voucher.campaignName}</p>
          <p className="text-sm text-blue-700">Voucher Code: {voucher.voucherCode}</p>
          <p className="text-sm text-blue-700">Value: ₹{voucher.voucherValue}</p>
          <p className="text-sm text-blue-700">Points Required: {voucher.pointsRequired}</p>
          <p className="text-sm text-blue-700">Expiry: {new Date(voucher.expiryDate).toLocaleString()}</p>
          {/* Eligible products UI or error/info message */}
          {eligibleProducts && eligibleProducts.length > 0 ? (
            <div className="mt-2">
              <p className="text-sm text-blue-700 font-medium mb-1">Select Product(s) to Redeem:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eligibleProducts.map(product => {
                  const id = product.id || product.campaignProductId;
                  const name = product.name || product.productName;
                  const isSelected = selectedProducts.find(p => (p.id || p.campaignProductId) === id);
                  const disabled = !isSelected && (selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0) + (product.retailPrice || 0) > (voucher.voucherValue || voucher.pointsRequired));
                  return (
                    <div
                      key={id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors shadow-sm hover:shadow-md ${isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <div className="text-sm text-gray-600 mb-1">Price: <span className="font-bold">₹{product.retailPrice}</span></div>
                      {product.brand && <div className="text-xs text-gray-400 mb-1">Brand: {product.brand.trim()}</div>}
                      {product.description && <div className="text-xs text-gray-400 mb-1">{product.description.trim()}</div>}
                      {isSelected && <div className="text-xs text-blue-600 font-semibold mt-2">Selected</div>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-700">
                Total Value Used: <span className="font-bold">{selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0)}</span> / <span className="font-bold">{voucher.voucherValue || voucher.pointsRequired}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              {error ? error : 'No eligible products available for this voucher.'}
            </div>
          )}
          <button
            onClick={handleRedeem}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium w-full md:w-auto"
            disabled={selectedProducts.length === 0 || selectedProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0) > (voucher.voucherValue || voucher.pointsRequired) || redeeming}
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