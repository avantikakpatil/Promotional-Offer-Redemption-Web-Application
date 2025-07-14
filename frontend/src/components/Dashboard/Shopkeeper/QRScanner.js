import React, { useState, useRef, useEffect } from 'react';
import QRScanner from '../Customer/QRScanner';
import api from '../../../services/api';

const ShopkeeperQRScanner = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedVoucher, setScannedVoucher] = useState(null);
  const [redemptionResult, setRedemptionResult] = useState(null);
  const [redemptionMessage, setRedemptionMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const handleQRScan = async (qrData) => {
    console.log('QR Code scanned:', qrData);
    setShowScanner(false);
    setIsProcessing(true);

    try {
      // Call API to validate QR code
      const response = await api.post('/shopkeeper/redemption/validate-qr', {
        qrCode: qrData
      });

      const voucherData = response.data;
      setScannedVoucher(voucherData);
      setAvailableProducts(voucherData.eligibleProducts || []);
      setRedemptionResult('success');
      setRedemptionMessage('Voucher validated successfully! Ready for redemption.');
    } catch (error) {
      console.error('Error processing QR code:', error);
      setRedemptionResult('error');
      setRedemptionMessage(error.response?.data?.error || 'Failed to process voucher. Please try again.');
      setScannedVoucher(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!scannedVoucher) return;

    setIsProcessing(true);
    try {
      // Call API to redeem voucher
      const response = await api.post('/shopkeeper/redemption/redeem', {
        qrCode: scannedVoucher.qrCode,
        selectedProductIds: selectedProducts.map(p => p.id)
      });

      const result = response.data;
      setRedemptionResult('success');
      setRedemptionMessage(`Voucher redeemed successfully! ₹${result.redeemedValue} discount applied.`);
      
      // Clear scanned voucher after successful redemption
      setTimeout(() => {
        setScannedVoucher(null);
        setRedemptionResult(null);
        setRedemptionMessage('');
        setSelectedProducts([]);
      }, 3000);
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      setRedemptionResult('error');
      setRedemptionMessage(error.response?.data?.error || 'Failed to redeem voucher. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.find(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleManualEntry = () => {
    const voucherCode = prompt('Enter voucher code:');
    if (voucherCode) {
      handleQRScan(voucherCode);
    }
  };

  const resetScanner = () => {
    setShowScanner(false);
    setScannedVoucher(null);
    setRedemptionResult(null);
    setRedemptionMessage('');
    setSelectedProducts([]);
  };

  const getTotalValue = () => {
    return selectedProducts.reduce((sum, product) => sum + product.retailPrice, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">QR Code Scanner</h1>
        <p className="text-gray-600 mt-2">Scan reseller vouchers to process redemptions</p>
      </div>

      {/* Scanner Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          {!showScanner && !scannedVoucher && (
            <div className="space-y-4">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-xl font-semibold text-gray-800">Ready to Scan</h2>
              <p className="text-gray-600 mb-6">Scan a reseller's QR code to redeem their voucher</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Scanner
                </button>
                <button
                  onClick={handleManualEntry}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Manual Entry
                </button>
              </div>
            </div>
          )}

          {showScanner && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Scanning QR Code</h2>
              <p className="text-gray-600">Point your camera at the reseller's QR code</p>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <QRScanner onScan={handleQRScan} />
              </div>
              
              <button
                onClick={resetScanner}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">Processing...</h3>
            <p className="text-gray-600">Please wait while we validate the voucher</p>
          </div>
        </div>
      )}

      {/* Voucher Details */}
      {scannedVoucher && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Voucher Details</h2>
              <p className="text-gray-600">Review voucher information before redemption</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Valid
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Voucher Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Voucher Code:</span>
                  <span className="font-medium">{scannedVoucher.voucherCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium text-green-600">₹{scannedVoucher.voucherValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points Required:</span>
                  <span className="font-medium">{scannedVoucher.pointsRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium">{new Date(scannedVoucher.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Reseller Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Reseller:</span>
                  <span className="font-medium">{scannedVoucher.resellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaign:</span>
                  <span className="font-medium">{scannedVoucher.campaignName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          {availableProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Select Products for Redemption</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelection(product)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.find(p => p.id === product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                        <p className="text-sm text-gray-600">₹{product.retailPrice}</p>
                      </div>
                      {selectedProducts.find(p => p.id === product.id) && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redemption Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Redemption Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Products:</span>
                <span className="font-medium">{selectedProducts.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">₹{getTotalValue()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Voucher Value:</span>
                <span className="font-medium text-green-600">₹{scannedVoucher.voucherValue}</span>
              </div>
              {getTotalValue() > scannedVoucher.voucherValue && (
                <div className="text-red-600 text-sm">
                  Warning: Selected products exceed voucher value
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleRedeemVoucher}
              disabled={isProcessing || getTotalValue() > scannedVoucher.voucherValue}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Redeem Voucher'}
            </button>
            <button
              onClick={resetScanner}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result Messages */}
      {redemptionResult && (
        <div className={`bg-white rounded-lg shadow p-6 ${
          redemptionResult === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
        }`}>
          <div className="text-center">
            <div className={`text-4xl mb-4 ${
              redemptionResult === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {redemptionResult === 'success' ? '✅' : '❌'}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              redemptionResult === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {redemptionResult === 'success' ? 'Success!' : 'Error'}
            </h3>
            <p className={`${
              redemptionResult === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {redemptionMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperQRScanner; 