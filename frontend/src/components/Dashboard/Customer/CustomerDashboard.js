import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaHistory, FaGift, FaCoins, FaTrophy, FaFire, FaStar, FaBolt, FaGamepad, FaShare, FaCalendarAlt, FaChartLine, FaHeart, FaCheck, FaCrown, FaRocket } from 'react-icons/fa';
import QRScanner from './QRScanner';
import { fetchQRInfo, redeemCoupon, getErrorIcon, getErrorColor } from './qrInfoFetcher';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../../contexts/AuthContext';

const HaldiramsDashboard = () => {


  const [points, setPoints] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [streak, setStreak] = useState(12);
  const [level, setLevel] = useState(8);
  const [nextLevelPoints, setNextLevelPoints] = useState(3000);
  const [weeklyProgress, setWeeklyProgress] = useState(65);
  const [notifications, setNotifications] = useState(3);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrRawData, setQrRawData] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [redeemResult, setRedeemResult] = useState(null); // null, 'success', or 'error'
  const [redeemMessage, setRedeemMessage] = useState('');
  // TODO: Replace with actual customerId from auth context
  const customerId = 1;
  
  const [redemptionHistory, setRedemptionHistory] = useState([]);

  // Remove dummy data from availableOffers and fetch real data from backend
  const [availableOffers, setAvailableOffers] = useState([]);

  // Fetch reward tiers from backend on mount
  useEffect(() => {
    async function fetchRewards() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customer/qrcodes/rewards', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!response.ok) throw new Error('Failed to fetch rewards');
        const data = await response.json();
        // Map backend reward tier fields to offer display fields
        const offers = data.map(rt => ({
          id: rt.id,
          title: rt.reward || rt.title || 'Reward',
          points: rt.threshold || rt.points || 0,
          description: rt.reward || '',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', // You can customize color logic
          icon: '🎁', // You can customize icon logic
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
  const progress = (points / nextLevelPoints) * 100;

  // Request camera permission and start video stream
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

  // Stop video stream
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

  // Simple QR code detection (mock implementation)
  const startQRScanning = () => {
    intervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Mock QR detection - in real implementation, you'd use a QR library
        // This simulates finding a QR code after a few seconds
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

  // Handle QR code detection
  const handleQRCodeDetected = (qrData) => {
    setScannedData(qrData);
    stopCamera();
    // Do not update points here; only update after backend confirmation
    // Add to history (optional, for immediate UI feedback, but not points)
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

  // Handle QR scanner toggle
  const handleQRScannerToggle = () => {
    if (showScanner) {
      setShowScanner(false);
      stopCamera();
      setScannedData(null);
      setScanError(null);
    } else {
      setShowScanner(true);
      requestCameraPermission();
    }
  };

  // Updated handleQRScan function
  const handleQRScan = async (qrRawString) => {
    console.log('QR Raw String received:', qrRawString);
    setQrRawData(qrRawString);
    setRedeemResult(null);
    setRedeemMessage('');
    try {
      const info = await fetchQRInfo(qrRawString);
      console.log('QR Info from fetchQRInfo:', info);
      if (info.error) {
        // If already redeemed, show direct message and do not allow redeem
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
        setRedeemResult(null); // Ready to redeem, not success yet
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

  // Updated handleRedeem function
  const handleRedeem = async () => {
    if (!qrRawData) {
      setRedeemResult('error');
      setRedeemMessage('No QR code data available.');
      return;
    }
    setRedeemResult('processing');
    setRedeemMessage('Processing redemption...');
    try {
      const result = await redeemCoupon(qrRawData, customerId);
      console.log('Redemption result:', result);
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
      console.error('Error in handleRedeem:', error);
      setRedeemResult('error');
      setRedeemMessage('An unexpected error occurred during redemption.');
    }
  };

  // Updated fetchUserPointsAndHistory function
  const fetchUserPointsAndHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/customer/qrcodes/history', {
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
      console.log('User data fetched:', data);
      if (data && typeof data.points === 'number') {
        setPoints(data.points);
        console.log('Points updated to:', data.points);
      }
      if (data && Array.isArray(data.redemptionHistory)) {
        const formattedHistory = data.redemptionHistory.map(h => ({
          id: h.id || h.redeemedAt,
          date: new Date(h.redeemedAt).toISOString().split('T')[0],
          points: h.points,
          offer: `QR Scan: ${h.qrCode || h.product || 'Unknown'}`,
          status: 'completed',
          icon: '📱',
          isAddition: h.points > 0
        }));
        setRedemptionHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Add useEffect for debugging points state
  useEffect(() => {
    console.log('Points state updated:', points);
  }, [points]);

  // Cleanup on unmount
  useEffect(() => {
    fetchUserPointsAndHistory();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    // Fetch user points and history on mount
    fetchUserPointsAndHistory();
  }, []);

  const [showRewardQRModal, setShowRewardQRModal] = useState(false);
  const [rewardQRData, setRewardQRData] = useState(null);

  const { user } = useAuth();

  const handleRedeemOffer = (offerId, pointsCost) => {
    // Instead of redeeming directly, show QR modal for reseller to scan
    const reward = availableOffers.find(o => o.id === offerId);
    const qrPayload = {
      type: 'reward_redeem',
      customerId: user?.id, // Use real logged-in customer id
      rewardId: offerId,
      points: pointsCost,
      rewardTitle: reward?.title,
      timestamp: Date.now(),
    };
    setRewardQRData(qrPayload);
    setShowRewardQRModal(true);
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
{/* Available Points */}
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
        {/* Overview Tab */}
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

        {/* Rewards Tab */}
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
            {/* Reward QR Modal */}
            {showRewardQRModal && rewardQRData && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full flex flex-col items-center">
                  <h3 className="text-xl font-bold mb-4">Show this QR to the Reseller</h3>
                  <QRCodeCanvas
                    value={JSON.stringify(rewardQRData)}
                    size={220}
                    includeMargin={true}
                  />
                  <div className="mt-4 text-center">
                    <div className="font-mono text-sm text-gray-900">Reward: {rewardQRData.rewardTitle}</div>
                    <div className="text-xs text-gray-500 mt-1">Points: {rewardQRData.points}</div>
                  </div>
                  <button
                    onClick={() => setShowRewardQRModal(false)}
                    className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <FaHistory className="text-2xl text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">Redemption History</h2>
            </div>
            <div className="space-y-4">
              {redemptionHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-red-50 border border-red-100">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.offer}</h3>
                    <p className="text-sm text-gray-600">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{item.isAddition ? `+${item.points}` : item.points}</p>
                    <span className={`text-xs px-2 py-1 ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'completed' ? 'Completed' : item.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal/Section */}
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

            {/* QR Result Display - Success, Error, or Ready to Redeem */}
      {((qrInfo && redeemResult === null) || redeemResult) && (
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
      )}
    </div>
  );
};

export default HaldiramsDashboard;