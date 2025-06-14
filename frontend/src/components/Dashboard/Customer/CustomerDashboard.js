import React, { useState, useEffect, useRef } from 'react';
import { FaQrcode, FaHistory, FaGift, FaCoins, FaTrophy, FaFire, FaStar, FaBolt, FaGamepad, FaShare, FaCalendarAlt, FaChartLine, FaHeart, FaCheck, FaCrown, FaRocket } from 'react-icons/fa';

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
  
  const [redemptionHistory, setRedemptionHistory] = useState([
    { id: 1, date: '2024-06-12', points: 500, offer: 'Free Premium Sweets Box', status: 'completed', icon: '🍯' },
    { id: 2, date: '2024-06-10', points: 200, offer: 'Free Home Delivery', status: 'completed', icon: '🚚' },
    { id: 3, date: '2024-06-08', points: 150, offer: 'Festival Special Discount', status: 'completed', icon: '🎊' },
    { id: 4, date: '2024-06-05', points: 300, offer: 'Double Points on Namkeens', status: 'active', icon: '🥨' },
  ]);

  const [availableOffers, setAvailableOffers] = useState([
    { id: 1, title: 'Premium Sweets Hamper', points: 800, description: 'Assorted traditional sweets including Gulab Jamun & Kaju Katli', gradient: 'from-red-500 to-orange-500', icon: '🍯' },
    { id: 2, title: 'Namkeen Combo Pack', points: 600, description: 'Mixed variety pack of Bhujia, Mathri & Mixture', gradient: 'from-yellow-500 to-orange-500', icon: '🥨' },
    { id: 3, title: 'Festival Special Box', points: 1000, description: 'Premium festival collection with 12 varieties', gradient: 'from-red-500 to-pink-500', icon: '🎁' },
    { id: 4, title: 'Free Delivery Pass', points: 400, description: 'Free delivery on all orders for 30 days', gradient: 'from-green-500 to-teal-500', icon: '🚚' },
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
  const progress = (points / nextLevelPoints) * 100;

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
    if (level >= 10) return 'from-yellow-400 to-orange-500';
    if (level >= 7) return 'from-red-400 to-orange-500';
    if (level >= 4) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-pink-500';
  };

  const TabButton = ({ id, icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' 
          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Haldiram's Rewards
              </h1>
            </div>
            <p className="text-gray-600 mt-2">Delicious Level {level} • {streak} day streak 🔥</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                {notifications}
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
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
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Taste Level Progress</h2>
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getLevelColor(level)} text-white font-bold`}>
                  Level {level} - Delicious
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{points} points</span>
                  <span>{nextLevelPoints - points} to next level</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Available Points</p>
                    <p className="text-3xl font-bold">{points.toLocaleString()}</p>
                  </div>
                  <div className="text-4xl">🪙</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FaFire className="text-red-200" />
                  <span className="text-sm">+127 this week</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Sweet Points</p>
                    <p className="text-3xl font-bold">{redeemedPoints.toLocaleString()}</p>
                  </div>
                  <div className="text-4xl">🍯</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FaRocket className="text-yellow-200" />
                  <span className="text-sm">4 rewards claimed</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Namkeen Streak</p>
                    <p className="text-3xl font-bold">{streak} days</p>
                  </div>
                  <div className="text-4xl">🥨</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FaFire className="text-orange-200" />
                  <span className="text-sm">Personal best!</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Weekly Goal</p>
                    <p className="text-3xl font-bold">{weeklyProgress}%</p>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-green-300 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowScanner(!showScanner)}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl hover:from-red-100 hover:to-orange-100 transition-all duration-200 border border-red-200"
                >
                  <FaQrcode className="text-2xl text-red-600" />
                  <span className="text-sm font-medium text-red-700">Scan QR</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 border border-yellow-200">
                  <FaShare className="text-2xl text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Share & Earn</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl hover:from-green-100 hover:to-teal-100 transition-all duration-200 border border-green-200">
                  <div className="text-2xl">🍯</div>
                  <span className="text-sm font-medium text-green-700">Order Sweets</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-200 border border-orange-200">
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
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🎁 Available Rewards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableOffers.map((offer) => (
                  <div key={offer.id} className={`bg-gradient-to-br ${offer.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 text-6xl opacity-20">{offer.icon}</div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                      <p className="text-sm opacity-90 mb-4">{offer.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-300 text-xl">🪙</div>
                          <span className="font-bold">{offer.points} points</span>
                        </div>
                        <button
                          onClick={() => handleRedeemOffer(offer.id, offer.points)}
                          disabled={points < offer.points}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            points >= offer.points
                              ? 'bg-white text-gray-800 hover:bg-gray-100'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📱 QR Code Scanner</h3>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="max-w-sm mx-auto">
                  <video ref={videoRef} className="w-full rounded-lg border-4 border-dashed border-red-300" />
                  <p className="text-center text-gray-600 mt-2">Position QR code within the frame</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <FaBolt className="text-2xl text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-800">Daily Tasks</h2>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                +{dailyTasks.reduce((acc, task) => acc + (task.completed ? 0 : task.points), 0)} points available
              </div>
            </div>
            <div className="space-y-4">
              {dailyTasks.map((task) => (
                <div key={task.id} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
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
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <FaTrophy className="text-2xl text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">Achievements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' 
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
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
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
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <FaHistory className="text-2xl text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">Redemption History</h2>
            </div>
            <div className="space-y-4">
              {redemptionHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.offer}</h3>
                    <p className="text-sm text-gray-600">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">-{item.points} points</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
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
    </div>
  );
};

export default HaldiramsDashboard;