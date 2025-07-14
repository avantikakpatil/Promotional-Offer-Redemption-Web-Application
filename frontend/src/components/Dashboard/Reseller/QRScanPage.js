import React, { useState } from 'react';
import { FaQrcode, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import QRScanner from './QRScanner';
import { fetchQRInfo, redeemQRCode, getErrorIcon, getErrorColor } from './qrInfoFetcher';
import { useAuth } from '../../../contexts/AuthContext';

const QRScanPage = () => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrRawData, setQrRawData] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [redeemResult, setRedeemResult] = useState(null);
  const [redeemMessage, setRedeemMessage] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  
  const { user } = useAuth();
  const resellerId = user?.id || 1;
  const navigate = useNavigate();

  const handleQRScan = async (qrRawString) => {
    console.log('QR Raw String received:', qrRawString);
    setQrRawData(qrRawString);
    setRedeemResult(null);
    setRedeemMessage('');
    
    try {
      const info = await fetchQRInfo(qrRawString);
      console.log('QR Info from fetchQRInfo:', info);
      
      if (info.error) {
        if (info.errorCode === 'ALREADY_REDEEMED') {
          setRedeemResult('error');
          setRedeemMessage('This QR code has already been redeemed and can only be used once.');
          setQrInfo(null);
          setShowQRScanner(false);
          return;
        }
        setRedeemResult('error');
        setRedeemMessage(info.message);
        setQrInfo(null);
      } else {
        setQrInfo(info);
        setRedeemResult(null);
        setRedeemMessage('QR code scanned successfully! Ready to redeem.');
      }
    } catch (error) {
      console.error('Error in handleQRScan:', error);
      setRedeemResult('error');
      setRedeemMessage('Failed to process QR code. Please try again.');
      setQrInfo(null);
    }
    setShowQRScanner(false);
  };

  const handleRedeem = async () => {
    if (!qrRawData) {
      setRedeemResult('error');
      setRedeemMessage('No QR code data available.');
      return;
    }
    
    setRedeemResult('processing');
    setRedeemMessage('Processing redemption...');
    
    try {
      const result = await redeemQRCode(qrRawData, resellerId);
      console.log('Redemption result:', result);
      
      if (result.error) {
        setRedeemResult('error');
        setRedeemMessage(result.message);
      } else {
        setRedeemResult('success');
        setRedeemMessage(`QR code redeemed successfully! ${qrInfo && qrInfo.points ? qrInfo.points : ''} points have been added to your account.`);
        
        // Add to scan history
        const newScan = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          customerName: qrInfo?.customerName || 'Unknown',
          product: qrInfo?.product || 'Unknown',
          campaignName: qrInfo?.campaignName || 'Unknown',
          points: qrInfo?.points || 0,
          status: 'success'
        };
        setScanHistory(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans
        
        setQrInfo(null);
        setQrRawData(null);
      }
    } catch (error) {
      console.error('Error in handleRedeem:', error);
      setRedeemResult('error');
      setRedeemMessage('An unexpected error occurred during redemption.');
    }
  };

  const resetScanner = () => {
    setQrInfo(null);
    setQrRawData(null);
    setRedeemResult(null);
    setRedeemMessage('');
    setShowQRScanner(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/reseller')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">QR Code Scanner</h1>
              <p className="text-gray-600 mt-2">Scan customer QR codes to redeem points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mb-6">
            <FaQrcode className="text-6xl text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Ready to Scan</h2>
            <p className="text-gray-600">Click the button below to start scanning customer QR codes</p>
          </div>
          
          <button
            onClick={() => setShowQRScanner(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Start QR Scanner
          </button>
        </div>
      </div>

      {/* Recent Scans */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Scans</h2>
          <div className="space-y-3">
            {scanHistory.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{scan.customerName}</h3>
                  <p className="text-sm text-gray-600">{scan.product} - {scan.campaignName}</p>
                  <p className="text-xs text-gray-500">{new Date(scan.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{scan.points} points</p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {scan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Scan Customer QR Code</h3>
              <button onClick={resetScanner} className="text-gray-500 hover:text-gray-700">✖</button>
            </div>
            <QRScanner
              onScan={handleQRScan}
              onClose={resetScanner}
            />
          </div>
        </div>
      )}

      {/* QR Result Display */}
      {((qrInfo && redeemResult === null) || redeemResult) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full">
            {(() => {
              let errorCode = null;
              if (redeemResult === 'error' && redeemMessage) {
                if (qrInfo && qrInfo.errorCode) errorCode = qrInfo.errorCode;
                else if (redeemMessage.toLowerCase().includes('already been redeemed')) errorCode = 'ALREADY_REDEEMED';
                else if (redeemMessage.toLowerCase().includes('invalid qr code')) errorCode = 'INVALID_QR_CODE';
                else if (redeemMessage.toLowerCase().includes('campaign')) errorCode = 'CAMPAIGN_INACTIVE';
              }
              const colorClass = getErrorColor(errorCode);
              const icon = getErrorIcon(errorCode);
              return (
                <div className={`p-4 rounded ${redeemResult === 'error' ? colorClass : 'bg-green-50 border-green-200 text-green-800'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{redeemResult === 'error' ? icon : '✅'}</span>
                    <span className="font-semibold">
                      {redeemResult === 'error' ? 'Error' : redeemResult === 'success' ? 'Success' : 'QR Code Scanned'}
                    </span>
                  </div>
                  <p className="text-sm">{redeemMessage}</p>
                  {(redeemResult === null && qrInfo) && (
                    <div className="mt-3 space-y-1 text-xs text-blue-600">
                      <p><strong>Product:</strong> {qrInfo.product}</p>
                      <p><strong>Campaign:</strong> {qrInfo.campaignName}</p>
                      <p><strong>Points:</strong> +{qrInfo.points}</p>
                      <p><strong>Customer:</strong> {qrInfo.customerName || 'Unknown'}</p>
                    </div>
                  )}
                  {(redeemResult === 'success' && qrInfo) && (
                    <div className="mt-3 space-y-1 text-xs text-green-600">
                      <p><strong>Product:</strong> {qrInfo.product}</p>
                      <p><strong>Campaign:</strong> {qrInfo.campaignName}</p>
                      <p><strong>Points Added:</strong> +{qrInfo.points}</p>
                      <p><strong>Customer:</strong> {qrInfo.customerName || 'Unknown'}</p>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="mt-4 flex gap-2">
              {redeemResult === 'success' ? (
                <button 
                  onClick={resetScanner}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              ) : redeemResult === 'error' ? (
                <button 
                  onClick={() => { setRedeemResult(null); setRedeemMessage(''); }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              ) : redeemResult === 'processing' ? (
                <button 
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
                >
                  Processing...
                </button>
              ) : (
                <button
                  onClick={handleRedeem}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Redeem
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanPage; 