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
        setVoucher({ ...response.data, qrCode: qrCodeToSend });
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
      // For simplicity, redeem all eligible products if present
      const selectedProductIds = voucher.eligibleProducts ? voucher.eligibleProducts.map(p => p.id) : [];
      const response = await axios.post('/api/shopkeeper/redemption/redeem', {
        QRCode: voucher.qrCode,
        SelectedProductIds: selectedProductIds
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess('Voucher redeemed successfully!');
      setVoucher(null);
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
          {voucher.eligibleProducts && voucher.eligibleProducts.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-blue-700 font-medium">Eligible Products:</p>
              <ul className="list-disc list-inside text-sm text-blue-700">
                {voucher.eligibleProducts.map(p => (
                  <li key={p.id}>{p.name} (₹{p.retailPrice})</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleRedeem}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            disabled={redeeming}
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