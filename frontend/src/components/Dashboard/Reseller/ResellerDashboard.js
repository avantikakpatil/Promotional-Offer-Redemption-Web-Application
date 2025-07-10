import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaHistory, FaGift, FaChartLine } from 'react-icons/fa';
import QRScanner from '../Customer/QRScanner';
import { fetchQRInfo, redeemCoupon, getErrorIcon, getErrorColor } from '../Customer/qrInfoFetcher';

const ResellerDashboard = () => {
  // --- All state and logic from CustomerDashboard.js ---
  const [points, setPoints] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [cameraPermission, setCameraPermission] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrRawData, setQrRawData] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [redeemResult, setRedeemResult] = useState(null); // null, 'success', or 'error'
  const [redeemMessage, setRedeemMessage] = useState('');
  // TODO: Replace with actual resellerId from auth context
  const resellerId = 1;
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);
  // Add state for reward transfer
  const [rewardTransferResult, setRewardTransferResult] = useState(null); // {success, message}
  const [rewardTransferModal, setRewardTransferModal] = useState(false);

  useEffect(() => {
    async function fetchRewards() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reseller/rewards', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!response.ok) throw new Error('Failed to fetch rewards');
        const data = await response.json();
        const offers = data.map(rt => ({
          id: rt.id,
          title: rt.reward || rt.title || 'Reward',
          points: rt.threshold || rt.points || 0,
          description: rt.reward || '',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '🎁',
        }));
        setAvailableOffers(offers);
      } catch (error) {
        console.error('Error fetching rewards:', error);
      }
    }
    fetchRewards();
  }, []);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const requestCameraPermission = async () => {
    try {
      setScanError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraPermission('granted');
        setScannerActive(true);
        startQRScanning();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraPermission('denied');
      setScanError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const startQRScanning = () => {
    intervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const mockQRDetection = Math.random() > 0.98;
        if (mockQRDetection) {
          const mockQRData = {
            type: 'purchase',
            productId: 'HLD-' + Math.floor(Math.random() * 1000),
            points: Math.floor(Math.random() * 100) + 50,
            product: ['Premium Sweets', 'Namkeen Mix', 'Festival Box', 'Mithai Special'][Math.floor(Math.random() * 4)]
          };
          handleQRCodeDetected(mockQRData);
        }
      }
    }, 100);
  };

  const handleQRCodeDetected = (qrData) => {
    setScannedData(qrData);
    stopCamera();
    const newRedemption = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      points: qrData.points,
      offer: `QR Scan: ${qrData.product}`,
      status: 'completed',
      icon: '📱'
    };
    setRedemptionHistory(prev => [newRedemption, ...prev]);
  };

  const handleQRScannerToggle = () => {
    if (showScanner) {
      setShowScanner(false);
      stopCamera();
      setScannedData(null);
      setScanError(null);
    } else {
      setShowQRScanner(true);
      requestCameraPermission();
    }
  };

  const handleQRScan = async (qrRawString) => {
    setQrRawData(qrRawString);
    setRedeemResult(null);
    setRedeemMessage('');
    setRewardTransferResult(null);
    setRewardTransferModal(false);
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(qrRawString);
      } catch (e) {}
      if (parsed && parsed.type === 'reward_redeem') {
        // This is a customer reward QR for transfer
        setRewardTransferModal(true);
        // Call backend to process transfer
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reseller/rewards/redeem-from-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ ...parsed, resellerId })
        });
        const result = await response.json();
        setRewardTransferResult(result);
        if (result.success) {
          await fetchUserPointsAndHistory();
        }
        setShowQRScanner(false);
        return;
      }
      const info = await fetchQRInfo(qrRawString);
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
      const result = await redeemCoupon(qrRawData, resellerId);
      if (result.error) {
        setRedeemResult('error');
        setRedeemMessage(result.message);
      } else {
        setRedeemResult('success');
        setRedeemMessage(`QR code redeemed successfully! ${qrInfo && qrInfo.points ? qrInfo.points : ''} points have been added to your account.`);
        await fetchUserPointsAndHistory();
        setQrInfo(null);
        setQrRawData(null);
      }
    } catch (error) {
      setRedeemResult('error');
      setRedeemMessage('An unexpected error occurred during redemption.');
    }
  };

  const fetchUserPointsAndHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/reseller/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data.points === 'number') {
        setPoints(data.points);
      }
      if (data && Array.isArray(data.redemptionHistory)) {
        const formattedHistory = data.redemptionHistory.map(h => ({
          id: h.id || h.RedeemedAt,
          date: new Date(h.RedeemedAt).toISOString().split('T')[0],
          points: h.Points,
          offer: `QR Scan: ${h.QRCode || h.product || 'Unknown'}`,
          status: 'completed',
          icon: '📱',
          isAddition: h.Points > 0
        }));
        setRedemptionHistory(formattedHistory);
      }
    } catch (error) {
      // eslint-disable-next-line
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserPointsAndHistory();
    return () => {
      stopCamera();
    };
  }, []);

  const handleRedeemOffer = (offerId, pointsCost) => {
    fetchUserPointsAndHistory();
    const newRedemption = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      points: pointsCost,
      offer: availableOffers.find(o => o.id === offerId)?.title,
      status: 'pending',
      icon: availableOffers.find(o => o.id === offerId)?.icon
    };
    setRedemptionHistory([newRedemption, ...redemptionHistory]);
  };

  const TabButton = ({ id, icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 border transition-all duration-200 ${
        isActive 
          ? 'bg-red-500 text-white border-red-500 shadow-md' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}        
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <TabButton id="overview" icon={<FaChartLine />} label="Dashboard" isActive={activeTab === 'overview'} onClick={setActiveTab} />
            <TabButton id="rewards" icon={<FaGift />} label="Rewards" isActive={activeTab === 'rewards'} onClick={setActiveTab} />
            <TabButton id="history" icon={<FaHistory />} label="History" isActive={activeTab === 'history'} onClick={setActiveTab} />
          </div>
          <div className="bg-white shadow-md p-4 border border-red-200 text-red-800 flex items-center gap-4 min-w-[180px] ml-4">
            <div>
              <p className="text-red-600 text-xs">Available Points</p>
              <p className="text-2xl font-bold">{points.toLocaleString()}</p>
            </div>
            <div className="text-3xl">🪙</div>
          </div>
        </div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white shadow-md p-6 border border-gray-200 flex justify-center">
              <button 
                onClick={() => setShowQRScanner(true)}
                className="flex flex-col items-center gap-3 p-8 bg-red-50 hover:bg-red-100 transition-all duration-200 border-2 border-red-300 rounded-xl shadow-lg"
                style={{ minWidth: 220 }}
              >
                <FaQrcode className="text-6xl text-red-600 mb-2" />
                <span className="text-lg font-semibold text-red-700">Scan QR</span>
              </button>
            </div>
          </div>
        )}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-white shadow-md p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🎁 Available Rewards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableOffers.map((offer) => (
                  <div key={offer.id} className={`${offer.color} border-2 p-6 relative`}>
                    <div className="absolute top-0 right-0 text-6xl opacity-20">{offer.icon}</div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                      <p className="text-sm opacity-90 mb-4">{offer.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-600 text-xl">🪙</div>
                          <span className="font-bold">{offer.points} points</span>
                        </div>
                        <button
                          onClick={() => handleRedeemOffer(offer.id, offer.points)}
                          disabled={points < offer.points}
                          className={`px-4 py-2 font-medium transition-all duration-200 ${
                            points >= offer.points
                              ? 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                              : 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {points >= offer.points ? 'Redeem' : 'Need More Points'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="bg-white shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <FaHistory className="text-2xl text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">Redemption History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {redemptionHistory.map((item, idx) => {
                    // Parse reward info if present
                    let description = item.offer;
                    if (item.offer && item.offer.startsWith('QR Scan: Reward:')) {
                      description = 'Reward Redemption';
                    } else if (item.offer && item.offer.startsWith('QR Scan:')) {
                      description = item.offer.replace('QR Scan: ', '');
                    }
                    return (
                      <tr key={item.id || idx}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.date}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{description}</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-bold ${item.points > 0 ? 'text-green-700' : 'text-red-700'}`}>{item.points > 0 ? `+${item.points}` : item.points}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.status === 'completed' ? 'bg-green-100 text-green-700' :
                            item.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status === 'completed' ? 'Completed' : item.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Scan QR Code</h3>
                <button onClick={() => setShowQRScanner(false)} className="text-gray-500 hover:text-gray-700">✖</button>
              </div>
              <QRScanner
                onScan={handleQRScan}
                onClose={() => setShowQRScanner(false)}
              />
            </div>
          </div>
        )}
        {(qrInfo && redeemResult === null) || redeemResult ? (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full">
              {/* Determine error code and styling */}
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
                      <span className="font-semibold">{redeemResult === 'error' ? 'Error' : 'Success'}</span>
                    </div>
                    <p className="text-sm">{redeemMessage}</p>
                    {(redeemResult === null && qrInfo) && (
                      <div className="mt-3 space-y-1 text-xs text-blue-600">
                        <p><strong>Product:</strong> {qrInfo.product}</p>
                        <p><strong>Campaign:</strong> {qrInfo.campaignName}</p>
                        <p><strong>Points:</strong> +{qrInfo.points}</p>
                      </div>
                    )}
                    {(redeemResult === 'success' && qrInfo) && (
                      <div className="mt-3 space-y-1 text-xs text-green-600">
                        <p><strong>Product:</strong> {qrInfo.product}</p>
                        <p><strong>Campaign:</strong> {qrInfo.campaignName}</p>
                        <p><strong>Points Added:</strong> +{qrInfo.points}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="mt-4 flex gap-2">
                {redeemResult === 'success' ? (
                  <button 
                    onClick={() => { setQrInfo(null); setQrRawData(null); setRedeemResult(null); setRedeemMessage(''); }}
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
        ) : null}
      </div>
      {/* Reward Transfer Modal */}
      {rewardTransferModal && rewardTransferResult && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Customer Reward Redemption</h3>
            <div className={`mb-4 text-center ${rewardTransferResult.success ? 'text-green-700' : 'text-red-700'}`}>{rewardTransferResult.message}</div>
            <button
              onClick={() => { setRewardTransferModal(false); setRewardTransferResult(null); }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerDashboard;
