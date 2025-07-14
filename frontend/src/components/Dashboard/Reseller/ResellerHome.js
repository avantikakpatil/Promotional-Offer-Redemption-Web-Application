import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaQrcode } from 'react-icons/fa';
import { campaignAPI } from '../../../services/api';
import QRScanner from './QRScanner';
import { fetchQRInfo, redeemQRCode, getErrorIcon, getErrorColor } from './qrInfoFetcher';
import { useAuth } from '../../../contexts/AuthContext';

const ResellerHome = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // QR Scanning states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrRawData, setQrRawData] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [redeemResult, setRedeemResult] = useState(null); // null, 'success', or 'error'
  const [redeemMessage, setRedeemMessage] = useState('');
  
  // Real data states
  const [stats, setStats] = useState({
    totalPoints: 0,
    availableVouchers: 0,
    activeCampaigns: 0,
    totalRedemptions: 0
  });
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  
  const { user } = useAuth();
  const resellerId = user?.id || 1;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all data in parallel
      await Promise.all([
        fetchCampaigns(),
        fetchUserPoints(),
        fetchRedemptionHistory(),
        fetchVouchers()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await campaignAPI.getAvailableCampaigns();
      const campaignsData = response.data || [];
      
      // Take only the first 3 campaigns for the recent section
      setCampaigns(campaignsData.slice(0, 3));
      
      // Update active campaigns count (only approved and active campaigns)
      const now = new Date();
      const activeCampaignsCount = campaignsData.filter(campaign => {
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);
        return campaign.isActive && startDate <= now && endDate >= now && campaign.assignment?.isApproved;
      }).length;
      
      setStats(prevStats => ({
        ...prevStats,
        activeCampaigns: activeCampaignsCount
      }));
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/points', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          totalPoints: data.points || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching user points:', err);
    }
  };

  const fetchRedemptionHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/qrcodes/history', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const history = data.redemptionHistory || [];
        setRedemptionHistory(history.slice(0, 5)); // Get last 5 redemptions
        setStats(prevStats => ({
          ...prevStats,
          totalRedemptions: history.length
        }));
      }
    } catch (err) {
      console.error('Error fetching redemption history:', err);
    }
  };

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/vouchers', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const vouchers = data.vouchers || [];
        setRecentVouchers(vouchers.slice(0, 3)); // Get first 3 vouchers
        setStats(prevStats => ({
          ...prevStats,
          availableVouchers: vouchers.filter(v => v.isRedeemed === false).length
        }));
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    }
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    
    if (!campaign.isActive) return 'Inactive';
    if (startDate > now) return 'Upcoming';
    if (endDate < now) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // QR Scanning functions
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
        setQrInfo(null);
        setQrRawData(null);
        
        // Refresh data after successful redemption
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error in handleRedeem:', error);
      setRedeemResult('error');
      setRedeemMessage('An unexpected error occurred during redemption.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, Reseller!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Vouchers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableVouchers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRedemptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/reseller/campaigns"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <h3 className="font-medium text-gray-800">Browse Campaigns</h3>
              <p className="text-sm text-gray-600">Find new opportunities</p>
            </div>
          </Link>

          

          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
          >
            <FaQrcode className="text-2xl mr-3 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-800">Quick QR Scan</h3>
              <p className="text-sm text-gray-600">Scan and redeem immediately</p>
            </div>
          </button>

          <Link
            to="/reseller/vouchers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">🎫</span>
            <div>
              <h3 className="font-medium text-gray-800">Create Voucher</h3>
              <p className="text-sm text-gray-600">Convert points to vouchers</p>
            </div>
          </Link>

          <Link
            to="/reseller/qr-codes"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">📱</span>
            <div>
              <h3 className="font-medium text-gray-800">Generate QR Code</h3>
              <p className="text-sm text-gray-600">For voucher redemption</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Campaigns</h2>
            <Link to="/reseller/campaigns" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={fetchAllData} // Changed to fetchAllData to refresh all data
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                return (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">
                        by {campaign.manufacturer?.name || 'Unknown Manufacturer'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Valid until: {new Date(campaign.endDate).toLocaleDateString()}
                      </p>
                      {campaign.assignment && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          campaign.assignment.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.assignment.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium text-blue-600">{campaign.points} points</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">No campaigns available</p>
            </div>
          )}
        </div>

        {/* Recent Vouchers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Vouchers</h2>
            <Link to="/reseller/vouchers" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          {recentVouchers.length > 0 ? (
            <div className="space-y-3">
              {recentVouchers.map((voucher) => (
                <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800">{voucher.voucherCode || voucher.code}</h3>
                    <p className="text-sm text-gray-600">Value: ₹{voucher.value}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.isRedeemed 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {voucher.isRedeemed ? 'Used' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">No vouchers available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Redemption History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Redemption History</h2>
          <Link to="/reseller/history" className="text-blue-600 hover:text-blue-800 text-sm">
            View all
          </Link>
        </div>
        {redemptionHistory.length > 0 ? (
          <div className="space-y-3">
            {redemptionHistory.map((redemption) => (
              <div key={redemption.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{redemption.customerName || 'Unknown Customer'}</h3>
                  <p className="text-sm text-gray-600">{redemption.campaignName || 'Unknown Campaign'}</p>
                  <p className="text-xs text-gray-500">{new Date(redemption.redeemedAt).toLocaleString()}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-green-600">+{redemption.points} points</p>
                  <p className="text-xs text-gray-500">QR: {redemption.qrCode}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">No redemption history available</p>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Scan Customer QR Code</h3>
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
                    <span className="font-semibold">{redeemResult === 'error' ? 'Error' : redeemResult === 'success' ? 'Success' : 'QR Code Scanned'}</span>
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

export default ResellerHome; 