import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const EligibleProducts = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCampaigns();
    // Fetch all products for shopkeeper
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const response = await fetch('/api/shopkeeper/products', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchEligibleProducts(selectedCampaignId);
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

  const fetchAllProducts = async () => {
    try {
      const res = await api.get('/products');
      setAllProducts(res.data);
    } catch {
      setError('Failed to fetch products');
    }
  };

  const fetchEligibleProducts = async (campaignId) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/shopkeeper/campaigns/${campaignId}/eligible-products`);
      setEligibleProducts(res.data);
      setSelectedProductIds(res.data.map(p => p.id));
    } catch {
      setError('Failed to fetch eligible products');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProducts = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/shopkeeper/campaigns/${selectedCampaignId}/eligible-products`, selectedProductIds);
      setSuccess('Eligible products updated!');
      fetchEligibleProducts(selectedCampaignId);
    } catch {
      setError('Failed to update eligible products');
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
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Assign Eligible Products:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded p-2">
                {allProducts.map(product => (
                  <label key={product.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedProductIds(ids => [...ids, product.id]);
                        } else {
                          setSelectedProductIds(ids => ids.filter(id => id !== product.id));
                        }
                      }}
                    />
                    <span>{product.name} ({product.brand})</span>
                  </label>
                ))}
              </div>
              <button
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleAssignProducts}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Eligible Products'}
              </button>
              {success && <div className="mt-2 text-green-600">{success}</div>}
              {error && <div className="mt-2 text-red-600">{error}</div>}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Currently Eligible Products</h2>
              <ul className="list-disc ml-6">
                {eligibleProducts.map(p => (
                  <li key={p.id}>{p.name} ({p.brand})</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EligibleProducts; 