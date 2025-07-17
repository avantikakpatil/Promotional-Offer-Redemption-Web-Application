import React, { useState } from 'react';
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
  // Removed: showAddProductModal, newProduct, addProductLoading, addProductError

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
      setRedemptionResult('success');
      setRedemptionMessage('Voucher validated successfully! Ready for redemption.');

      // Fetch eligible products for the campaign if campaignId is available
      if (voucherData.campaignId) {
        const productsRes = await api.get(`/shopkeeper/campaigns/${voucherData.campaignId}/eligible-products`);
        setAvailableProducts(productsRes.data || []);
      } else {
        setAvailableProducts(voucherData.eligibleProducts || []);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setRedemptionResult('error');
      let errorMsg = 'Failed to process voucher. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || error.response.data.error || errorMsg;
      }
      setRedemptionMessage(errorMsg);
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
      let errorMsg = 'Failed to redeem voucher. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || error.response.data.error || errorMsg;
      }
      setRedemptionMessage(errorMsg);
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

  // Replace the product selection UI with a card/grid layout and add point logic
  const getTotalPointsUsed = () => {
    return selectedProducts.reduce((sum, product) => sum + (product.PointCost || 0), 0);
  };

  // Removed: handleAddProduct

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow p-6 flex items-center gap-4">
        <div className="text-4xl text-white">📱</div>
        <div>
          <h1 className="text-3xl font-bold text-white">Voucher QR Scanner</h1>
          <p className="text-blue-100 mt-1">Scan reseller vouchers and redeem products instantly</p>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          {!showScanner && !scannedVoucher && (
            <div className="space-y-4">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-800">Ready to Scan</h2>
              <p className="text-gray-600 mb-6">Scan a reseller's QR code to redeem their voucher</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
                >
                  Start Scanner
                </button>
                <button
                  onClick={handleManualEntry}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium shadow"
                >
                  Manual Entry
                </button>
              </div>
            </div>
          )}
          {showScanner && !scannedVoucher && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Scanning QR Code</h2>
              <p className="text-gray-600">Point your camera at the reseller's QR code</p>
              <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
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
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800">Processing...</h3>
          <p className="text-gray-600">Please wait while we validate the voucher</p>
        </div>
      )}

      {/* Voucher Details & Product Selection */}
      {scannedVoucher && !isProcessing && (
        <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Valid</span>
              <h2 className="text-2xl font-bold text-gray-800">Voucher Details</h2>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campaign:</span>
                    <span className="font-medium">{scannedVoucher.campaignName}</span>
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
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Select Products for Redemption</h3>
              {(scannedVoucher.eligibleProducts && scannedVoucher.eligibleProducts.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scannedVoucher.eligibleProducts.map(product => {
                    const isSelected = selectedProducts.find(p => p.id === product.id);
                    const disabled = !isSelected && (getTotalValue() + (product.retailPrice || 0) > (scannedVoucher.voucherValue || scannedVoucher.pointsRequired));
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors shadow-sm hover:shadow-md ${isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!disabled) handleProductSelection(product);
                        }}
                      >
                        <div className="font-semibold text-lg mb-1">{product.name && product.name.trim()}</div>
                        <div className="text-sm text-gray-600 mb-1">Price: <span className="font-bold">₹{product.retailPrice}</span></div>
                        {product.brand && <div className="text-xs text-gray-400 mb-1">Brand: {product.brand.trim()}</div>}
                        {product.description && <div className="text-xs text-gray-400 mb-1">{product.description.trim()}</div>}
                        {isSelected && <div className="text-xs text-blue-600 font-semibold mt-2">Selected</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No eligible products available for this voucher.</div>
              )}
              {/* Show total value used and remaining */}
              <div className="mt-4 text-sm text-gray-700">
                Total Value Used: <span className="font-bold">{getTotalValue()}</span> / <span className="font-bold">{scannedVoucher.voucherValue || scannedVoucher.pointsRequired}</span>
              </div>
              {/* Confirm button */}
              <button
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full md:w-auto"
                onClick={handleRedeemVoucher}
                disabled={selectedProducts.length === 0 || getTotalValue() > (scannedVoucher.voucherValue || scannedVoucher.pointsRequired) || isProcessing}
              >
                Confirm Redemption
              </button>
            </div>
          </div>

          {/* Sidebar: Redemption Summary */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-inner flex flex-col gap-4">
            <h3 className="font-semibold text-gray-800 mb-2">Redemption Summary</h3>
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
            <button
              onClick={resetScanner}
              className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors w-full"
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
            <p className={
              redemptionResult === 'success' ? 'text-green-700' : 'text-red-700'
            }>
              {redemptionMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperQRScanner; 