import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaHistory, FaGift, FaCoins, FaTrophy, FaFire, FaStar, FaBolt, FaGamepad, FaShare, FaCalendarAlt, FaChartLine, FaHeart, FaCheck, FaCrown, FaRocket } from 'react-icons/fa';
import QRScanner from './QRScanner';
import { fetchQRInfo, redeemCoupon } from './qrInfoFetcher';

const HaldiramsDashboard = () => {
  const [points, setPoints] = useState(2847);
  const [redeemedPoints, setRedeemedPoints] = useState(1250);
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
  const [redeemStatus, setRedeemStatus] = useState(null);
  // TODO: Replace with actual customerId from auth context
  const customerId = 1;
  
  const [redemptionHistory, setRedemptionHistory] = useState([
    { id: 1, date: '2024-06-12', points: 500, offer: 'Free Premium Sweets Box', status: 'completed', icon: '🍯' },
    { id: 2, date: '2024-06-10', points: 200, offer: 'Free Home Delivery', status: 'completed', icon: '🚚' },
    { id: 3, date: '2024-06-08', points: 150, offer: 'Festival Special Discount', status: 'completed', icon: '🎊' },
    { id: 4, date: '2024-06-05', points: 300, offer: 'Double Points on Namkeens', status: 'active', icon: '🥨' },
  ]);

  const [availableOffers, setAvailableOffers] = useState([
    { id: 1, title: 'Premium Sweets Hamper', points: 800, description: 'Assorted traditional sweets including Gulab Jamun & Kaju Katli', color: 'bg-red-100 text-red-800 border-red-200', icon: '🍯' },
    { id: 2, title: 'Namkeen Combo Pack', points: 600, description: 'Mixed variety pack of Bhujia, Mathri & Mixture', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🥨' },
    { id: 3, title: 'Festival Special Box', points: 1000, description: 'Premium festival collection with 12 varieties', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: '🎁' },
    { id: 4, title: 'Free Delivery Pass', points: 400, description: 'Free delivery on all orders for 30 days', color: 'bg-green-100 text-green-800 border-green-200', icon: '🚚' },
  ]);

  const [achievements, setAchievements] = useState([
    { id: 1, title: 'Sweet Tooth', desc: 'Ordered 10 sweet items', unlocked: true, icon: '🍯' },
    { id: 2, title: 'Namkeen Lover', desc: 'Tried 5 different namkeens', unlocked: true, icon: '🥨' },
    { id: 3, title: 'Festival Shopper', desc: 'Ordered during 3 festivals', unlocked: true, icon: '🎊' },
    { id: 4, title: 'Haldiram VIP', desc: 'Reached premium customer status', unlocked: false, icon: '👑' },
    { id: 5, title: 'Taste Explorer', desc: 'Tried 20+ different products', unlocked: false, icon: '🌟' },
  ]);

  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, task: 'Browse new arrivals', points: 10, completed: true },
    { id: 2, task: 'Share your favorite sweet', points: 25, completed: false },
    { id: 3, task: 'Rate a product', points: 50, completed: false },
    { id: 4, task: 'Refer a friend to Haldiram\'s', points: 100, completed: false },
  ]);

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
    
    // Add points based on QR code
    if (qrData.type === 'purchase') {
      setPoints(prevPoints => prevPoints + qrData.points);
      
      // Add to history
      const newRedemption = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        points: qrData.points,
        offer: `QR Scan: ${qrData.product}`,
        status: 'completed',
        icon: '📱'
      };
      setRedemptionHistory(prev => [newRedemption, ...prev]);
    }
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

  const handleQRScan = async (data) => {
    setQrRawData(data);
    const info = await fetchQRInfo(data);
    setQrInfo(info);
    setShowQRScanner(false);
    setRedeemStatus(null);
  };

  const handleRedeem = async () => {
    setRedeemStatus('processing');
    const result = await redeemCoupon(qrRawData, customerId);
    if (result.error) {
      setRedeemStatus('error');
    } else {
      setRedeemStatus('success');
      setPoints(result.newPoints);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleRedeemOffer = (offerId, pointsCost) => {
    if (points >= pointsCost) {
      setPoints(points - pointsCost);
      setRedeemedPoints(redeemedPoints + pointsCost);
      const newRedemption = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        points: pointsCost,
        offer: availableOffers.find(o => o.id === offerId)?.title,
        status: 'pending',
        icon: availableOffers.find(o => o.id === offerId)?.icon
      };
      setRedemptionHistory([newRedemption, ...redemptionHistory]);
    }
  };

  const completeTask = (taskId) => {
    setDailyTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: true }
          : task
      )
    );
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setPoints(points + task.points);
    }
  };

  const getLevelColor = (level) => {
    if (level >= 10) return 'bg-yellow-100 text-yellow-800';
    if (level >= 7) return 'bg-orange-100 text-orange-800';
    if (level >= 4) return 'bg-red-100 text-red-800';
    return 'bg-pink-100 text-pink-800';
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-8 bg-red-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h1 className="text-4xl font-bold text-red-600">
                Haldiram's Rewards
              </h1>
            </div>
            <p className="text-gray-600 mt-2">Delicious Level {level} • {streak} day streak 🔥</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-red-500 flex items-center justify-center text-white font-bold">
                {notifications}
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <TabButton id="overview" icon={<FaChartLine />} label="Dashboard" isActive={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="rewards" icon={<FaGift />} label="Rewards" isActive={activeTab === 'rewards'} onClick={setActiveTab} />
          <TabButton id="tasks" icon={<FaBolt />} label="Daily Tasks" isActive={activeTab === 'tasks'} onClick={setActiveTab} />
          <TabButton id="achievements" icon={<FaTrophy />} label="Achievements" isActive={activeTab === 'achievements'} onClick={setActiveTab} />
          <TabButton id="history" icon={<FaHistory />} label="History" isActive={activeTab === 'history'} onClick={setActiveTab} />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Level Progress */}
            <div className="bg-white shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Taste Level Progress</h2>
                <div className={`px-4 py-2 ${getLevelColor(level)} font-bold`}>
                  Level {level} - Delicious
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 h-4 mb-2">
                  <div 
                    className="bg-red-500 h-4 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{points} points</span>
                  <span>{nextLevelPoints - points} to next level</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-red-100 border border-red-200 shadow-md p-6 text-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm">Available Points</p>
                    <p className="text-3xl font-bold">{points.toLocaleString()}</p>
                  </div>
                  <div className="text-4xl">🪙</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FaFire className="text-red-500" />
                  <span className="text-sm">+127 this week</span>
                </div>
              </div>

              <div className="bg-yellow-100 border border-yellow-200 shadow-md p-6 text-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm">Sweet Points</p>
                    <p className="text-3xl font-bold">{redeemedPoints.toLocaleString()}</p>
                  </div>
                  <div className="text-4xl">🍯</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FaRocket className="text-yellow-600" />
                  <span className="text-sm">4 rewards claimed</span>
                </div>
              </div>

              <div className="bg-orange-100 border border-orange-200 shadow-md p-6 text-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm">Namkeen Streak</p>
                    <p className="text-3xl font-bold">{streak} days</p>
                  </div>
                  <div className="text-4xl">🥨</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FaFire className="text-orange-500" />
                  <span className="text-sm">Personal best!</span>
                </div>
              </div>

              <div className="bg-green-100 border border-green-200 shadow-md p-6 text-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm">Weekly Goal</p>
                    <p className="text-3xl font-bold">{weeklyProgress}%</p>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-green-200 h-2">
                    <div 
                      className="bg-green-600 h-2 transition-all duration-500"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowQRScanner(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 transition-all duration-200 border border-red-200"
                >
                  <FaQrcode className="text-2xl text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    Scan QR
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-yellow-50 hover:bg-yellow-100 transition-all duration-200 border border-yellow-200">
                  <FaShare className="text-2xl text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Share & Earn</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 transition-all duration-200 border border-green-200">
                  <div className="text-2xl">🍯</div>
                  <span className="text-sm font-medium text-green-700">Order Sweets</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 transition-all duration-200 border border-orange-200">
                  <div className="text-2xl">🥨</div>
                  <span className="text-sm font-medium text-orange-700">Buy Namkeens</span>
                </button>
              </div>
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

            {/* QR Scanner */}
            {showScanner && (
              <div className="bg-white shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📱 QR Code Scanner</h3>
                  <button
                    onClick={handleQRScannerToggle}
                    className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
                
                <div className="max-w-sm mx-auto">
                  {cameraPermission === null && (
                    <div className="text-center p-8 bg-blue-50 border border-blue-200">
                      <FaQrcode className="text-4xl text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-700 mb-4">Click "Allow" to grant camera access</p>
                      <button 
                        onClick={requestCameraPermission}
                        className="px-6 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}
                  
                  {cameraPermission === 'denied' && (
                    <div className="text-center p-8 bg-red-50 border border-red-200">
                      <div className="text-4xl text-red-600 mb-4">❌</div>
                      <p className="text-red-700 mb-4">{scanError}</p>
                      <p className="text-sm text-gray-600">
                        Please enable camera permissions in your browser settings and try again.
                      </p>
                    </div>
                  )}
                  
                  {cameraPermission === 'granted' && scannerActive && (
                    <div className="relative">
                      <video 
                        ref={videoRef} 
                        className="w-full border-4 border-dashed border-red-300 bg-black"
                        playsInline
                        muted
                      />
                      <canvas 
                        ref={canvasRef} 
                        className="hidden"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-red-500 border-dashed animate-pulse"></div>
                      </div>
                      <p className="text-center text-gray-600 mt-2">
                        <span className="animate-pulse">🔍 Scanning for QR codes...</span>
                      </p>
                    </div>
                  )}
                  
                  {scannedData && (
                    <div className="text-center p-6 bg-green-50 border border-green-200">
                      <div className="text-4xl text-green-600 mb-4">✅</div>
                      <h4 className="font-bold text-green-800 mb-2">QR Code Scanned!</h4>
                      <p className="text-sm text-gray-700 mb-2">Product: {scannedData.product}</p>
                      <p className="text-sm text-gray-700 mb-2">Product ID: {scannedData.productId}</p>
                      <div className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium inline-block">
                        +{scannedData.points} points added!
                      </div>
                      <button 
                        onClick={() => {
                          setScannedData(null);
                          setShowScanner(false);
                        }}
                        className="block w-full mt-4 px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <FaBolt className="text-2xl text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-800">Daily Tasks</h2>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 text-sm font-medium">
                +{dailyTasks.reduce((acc, task) => acc + (task.completed ? 0 : task.points), 0)} points available
              </div>
            </div>
            <div className="space-y-4">
              {dailyTasks.map((task) => (
                <div key={task.id} className={`p-4 border-2 transition-all duration-200 ${
                  task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 border-2 flex items-center justify-center ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {task.completed && <FaCheck className="text-white text-sm" />}
                      </div>
                      <div>
                        <p className={`font-medium ${task.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                          {task.task}
                        </p>
                        <p className="text-sm text-gray-600">+{task.points} points</p>
                      </div>
                    </div>
                    {!task.completed && (
                      <button
                        onClick={() => completeTask(task.id)}
                        className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="bg-white shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <FaTrophy className="text-2xl text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">Achievements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`p-4 border-2 transition-all duration-200 ${
                  achievement.unlocked 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-4xl mb-2 ${achievement.unlocked ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <h3 className={`font-bold mb-1 ${achievement.unlocked ? 'text-orange-700' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600">{achievement.desc}</p>
                    {achievement.unlocked && (
                      <div className="mt-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium">
                          Unlocked! 🎉
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                    <p className="font-bold text-gray-800">-{item.points} points</p>
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
          <div className="bg-white p-6 rounded shadow-lg relative">
            <QRScanner
              onScan={handleQRScan}
              onClose={() => setShowQRScanner(false)}
            />
            <button onClick={() => setShowQRScanner(false)} className="absolute top-2 right-2 text-gray-500">✖</button>
          </div>
        </div>
      )}

      {/* QR Info and Redemption UI */}
      {qrInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">QR Code Info</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm mb-4">{JSON.stringify(qrInfo, null, 2)}</pre>
            <button onClick={handleRedeem} className="px-4 py-2 bg-green-600 text-white rounded mr-2">Redeem Coupon</button>
            <button onClick={() => { setQrInfo(null); setQrRawData(null); setRedeemStatus(null); }} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            {redeemStatus === 'processing' && <div className="mt-2 text-blue-600">Processing...</div>}
            {redeemStatus === 'success' && <div className="mt-2 text-green-600">Coupon redeemed! Points updated.</div>}
            {redeemStatus === 'error' && <div className="mt-2 text-red-600">Redemption failed. Try again.</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default HaldiramsDashboard;