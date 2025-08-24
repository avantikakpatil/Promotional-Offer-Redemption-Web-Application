import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import CampaignCard from './CampaignCard';

const Vouchers = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingVoucher, setGeneratingVoucher] = useState({});
  const [voucherInfo, setVoucherInfo] = useState({});
  const [allVouchers, setAllVouchers] = useState([]);
  const [allFreeProductVouchers, setAllFreeProductVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const resellerId = user.id;

      // Fetch campaigns
      const campaignsResponse = await fetch('/api/reseller/order/available-campaigns', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!campaignsResponse.ok) throw new Error('Failed to fetch campaigns');
      const campaignsData = await campaignsResponse.json();
      setCampaigns(campaignsData);

      // Fetch voucher info for each campaign
      for (const campaign of campaignsData) {
        await fetchVoucherInfo(campaign.id, token);
      }

      // Fetch all vouchers
      const vouchersResponse = await fetch('/api/reseller/vouchers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!vouchersResponse.ok) throw new Error('Failed to fetch vouchers');
      const vouchersData = await vouchersResponse.json();
      setAllVouchers(vouchersData);

      // Fetch all free product vouchers
      if (resellerId) {
        const freeProductVouchersResponse = await fetch(`/api/reseller/free-product-vouchers?resellerId=${resellerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (freeProductVouchersResponse.ok) {
          const freeProductVouchersData = await freeProductVouchersResponse.json();
          setAllFreeProductVouchers(freeProductVouchersData.freeProductVouchers || []);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherInfo = async (campaignId, token) => {
    try {
      const response = await fetch(`/api/reseller/order/campaign/${campaignId}/voucher-info`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoucherInfo(prev => ({ ...prev, [campaignId]: data }));
      } else {
        let errorMsg = 'Failed to fetch voucher info.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch {}
        setVoucherInfo(prev => ({ ...prev, [campaignId]: { error: true, message: errorMsg } }));
      }
    } catch (err) {
      setVoucherInfo(prev => ({ ...prev, [campaignId]: { error: true, message: 'Network error while fetching voucher info.' } }));
    }
  };

  const generateVoucher = async (campaignId) => {
    try {
      setGeneratingVoucher(prev => ({ ...prev, [campaignId]: true }));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/reseller/order/campaign/${campaignId}/generate-voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();
      if (response.ok) {
        alert('Voucher generated successfully!');
        fetchAllData(); // Refresh all data
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error generating voucher:', err);
      alert('Failed to generate voucher. Please try again.');
    } finally {
      setGeneratingVoucher(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (canGenerate) => {
    return canGenerate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getButtonColor = (canGenerate, isFreeProduct = false) => {
    if (!canGenerate) {
      return 'bg-red-400 text-white cursor-not-allowed';
    }
    return isFreeProduct ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50';
  };

  const getCannotGenerateReason = (info, isFreeProduct = false) => {
    if (!info?.voucherGeneration) return 'Voucher generation not configured';
    
    const pointsNeeded = info.voucherGeneration.pointsNeeded || 0;
    
    if (isFreeProduct) {
      return `You need ${pointsNeeded} more units to generate a free product voucher`;
    } else {
      return `You need ${pointsNeeded} more points to generate a voucher`;
    }
  };

  const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const voucherCampaigns = filteredCampaigns.filter(c => c.rewardType === 'voucher' || c.rewardType === 'voucher_restricted');
  const freeProductCampaigns = filteredCampaigns.filter(c => c.rewardType === 'free_product');

  const [campaignTypeFilter, setCampaignTypeFilter] = useState('all'); // 'all', 'voucher', 'free_product'

  const getFilteredCampaigns = () => {
    if (campaignTypeFilter === 'voucher') {
      return voucherCampaigns;
    } else if (campaignTypeFilter === 'free_product') {
      return freeProductCampaigns;
    } else {
      return filteredCampaigns;
    }
  };

  const campaignsToDisplay = getFilteredCampaigns();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Voucher Campaigns</h1>
            <p className="text-sm text-gray-600 mt-1">Generate and view your vouchers for each campaign</p>
          </div>
          
        </div>
        <input
          type="text"
          placeholder="Search for a campaign..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mt-6"
        />

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setCampaignTypeFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              campaignTypeFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Campaigns ({filteredCampaigns.length})
          </button>
          <button
            onClick={() => setCampaignTypeFilter('voucher')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              campaignTypeFilter === 'voucher' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Voucher Campaigns ({voucherCampaigns.length})
          </button>
          <button
            onClick={() => setCampaignTypeFilter('free_product')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              campaignTypeFilter === 'free_product' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Free Product Campaigns ({freeProductCampaigns.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && campaignsToDisplay.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No campaigns found</h3>
          <p className="text-gray-600">
            {campaignTypeFilter === 'all' 
              ? 'There are no campaigns available at the moment.' 
              : `There are no ${campaignTypeFilter.replace('_', ' ')} campaigns matching your current filter.`
            }
          </p>
        </div>
      )}

      {!loading && !error && campaignsToDisplay.length > 0 && (
        <div className="space-y-8">
          {campaignTypeFilter === 'all' && (
            <div className="flex flex-col gap-4">
              {campaignsToDisplay.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  voucherInfo={voucherInfo}
                  generateVoucher={generateVoucher}
                  generatingVoucher={generatingVoucher}
                  getStatusColor={getStatusColor}
                  getButtonColor={getButtonColor}
                  getCannotGenerateReason={getCannotGenerateReason}
                  formatDate={formatDate}
                  allVouchers={allVouchers}
                  allFreeProductVouchers={allFreeProductVouchers}
                />
              ))}
            </div>
          )}

          {campaignTypeFilter === 'voucher' && voucherCampaigns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Voucher Campaigns</h2>
              <div className="flex flex-col gap-4">
                {voucherCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    voucherInfo={voucherInfo}
                    generateVoucher={generateVoucher}
                    generatingVoucher={generatingVoucher}
                    getStatusColor={getStatusColor}
                    getButtonColor={getButtonColor}
                    getCannotGenerateReason={getCannotGenerateReason}
                    formatDate={formatDate}
                    allVouchers={allVouchers}
                    allFreeProductVouchers={allFreeProductVouchers}
                  />
                ))}
              </div>
            </div>
          )}

          {campaignTypeFilter === 'free_product' && freeProductCampaigns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Free Product Campaigns</h2>
              <div className="flex flex-col gap-4">
                {freeProductCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    voucherInfo={voucherInfo}
                    generateVoucher={generateVoucher}
                    generatingVoucher={generatingVoucher}
                    getStatusColor={getStatusColor}
                    getButtonColor={getButtonColor}
                    getCannotGenerateReason={getCannotGenerateReason}
                    formatDate={formatDate}
                    allVouchers={allVouchers}
                    allFreeProductVouchers={allFreeProductVouchers}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Vouchers;
