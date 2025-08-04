import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const EligibleProducts = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [voucherProducts, setVoucherProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
    // Fetch all products for name lookup
    const fetchAllProducts = async () => {
      try {
        const res = await api.get('/shopkeeper/products');
        setAllProducts(res.data);
      } catch {
        // ignore error
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchVoucherProducts(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      // If response is { data: [...] }, use res.data.data
      setCampaigns(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      setError('Failed to fetch campaigns');
    }
  };




  // Fetch products to be given on voucher redemption (from campaignvoucherproducts)
  const fetchVoucherProducts = async (campaignId) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/shopkeeper/campaigns/${campaignId}/campaignvoucherproducts`);
      setVoucherProducts(res.data);
    } catch {
      setError('Failed to fetch voucher products');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Eligible Products by Campaign</h1>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Campaign:</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={selectedCampaignId}
            onChange={e => setSelectedCampaignId(e.target.value)}
          >
            <option value="">-- Select Campaign --</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {selectedCampaignId && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Products to Give on Voucher Redemption</h2>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : voucherProducts.length === 0 ? (
              <div className="text-gray-500">No voucher redemption products for this campaign.</div>
            ) : (
              <ul className="list-disc ml-6">
                {voucherProducts.map(p => {
                  // p is a campaignvoucherproduct object; join with allProducts by ProductId
                  let prod = null;
                  if (p && typeof p === 'object' && p.ProductId) {
                    prod = allProducts.find(ap => ap.id === p.ProductId);
                  }
                  return (
                    <li key={p.campaignProductId || p.id || p.ProductId}>
                      {prod ? `${prod.name}${prod.brand ? ` (${prod.brand})` : ''}` : p.productName || p.name || p.ProductId}
                      {typeof p.VoucherValue !== 'undefined' ? ` - Value: ₹${p.VoucherValue}` : ''}
                      {typeof p.IsActive === 'boolean' ? (p.IsActive ? ' (Active)' : ' (Inactive)') : ''}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibleProducts; 