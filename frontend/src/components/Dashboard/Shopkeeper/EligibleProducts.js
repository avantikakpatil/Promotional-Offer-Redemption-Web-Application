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
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchVoucherProducts(selectedCampaignId);
    } else {
      setVoucherProducts([]); // Clear products when no campaign selected
    }
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns');
      console.log('Campaigns response:', res.data); // Debug log
      // Handle different response structures
      setCampaigns(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      // Try different endpoints that might work
      let res;
      try {
        res = await api.get('/shopkeeper/products');
      } catch (err) {
        console.log('Trying alternative endpoint for products...');
        res = await api.get('/products');
      }
      
      console.log('All products response:', res.data); // Debug log
      const products = Array.isArray(res.data) ? res.data : res.data.data || [];
      setAllProducts(products);
    } catch (err) {
      console.error('Error fetching all products:', err);
      // Try to continue without product names - we'll show ProductId instead
      console.log('Continuing without product details - will show ProductId only');
    }
  };

  // Fetch products to be given on voucher redemption (from campaignvoucherproducts)
  const fetchVoucherProducts = async (campaignId) => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching voucher products for campaign:', campaignId); // Debug log
      
      // Try different possible endpoints
      let res;
      const possibleEndpoints = [
        `/shopkeeper/campaigns/${campaignId}/campaignvoucherproducts`,
        `/campaigns/${campaignId}/voucherproducts`,
        `/campaigns/${campaignId}/products`,
        `/campaignvoucherproducts/${campaignId}`,
        `/campaignvoucherproducts?campaignId=${campaignId}`
      ];
      
      let lastError;
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          res = await api.get(endpoint);
          console.log(`Success with endpoint: ${endpoint}`, res.data);
          break; // If successful, break out of loop
        } catch (err) {
          console.log(`Failed with endpoint ${endpoint}:`, err.response?.status || err.message);
          lastError = err;
          continue; // Try next endpoint
        }
      }
      
      if (!res) {
        throw lastError || new Error('All endpoints failed');
      }
      
      console.log('Voucher products response:', res.data); // Debug log
      
      // Handle different response structures
      const products = Array.isArray(res.data) ? res.data : res.data.data || [];
      setVoucherProducts(products);
      
      if (products.length === 0) {
        console.log('No voucher products found for campaign:', campaignId);
      }
    } catch (err) {
      console.error('Error fetching voucher products:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to fetch voucher products: ${err.response?.status === 404 ? 'Endpoint not found. Please check if the API endpoint exists.' : err.response?.data?.message || err.message}`);
      setVoucherProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get product details
  const getProductDetails = (voucherProduct) => {
    if (!voucherProduct || !allProducts.length) return null;

    // Try to match by ProductId, id, or campaignVoucherProductId
    const productId = voucherProduct.ProductId || voucherProduct.productId || voucherProduct.product_id || voucherProduct.id;
    // Try to match by campaignVoucherProductId if present
    const campaignVoucherProductId = voucherProduct.CampaignVoucherProductId || voucherProduct.campaignVoucherProductId;

    // Try to find by id
    let found = allProducts.find(product =>
      product.id === productId ||
      product.Id === productId ||
      String(product.id) === String(productId) ||
      String(product.Id) === String(productId)
    );
    // If not found, try to match by campaignVoucherProductId
    if (!found && campaignVoucherProductId) {
      found = allProducts.find(product =>
        product.campaignVoucherProductId === campaignVoucherProductId ||
        product.CampaignVoucherProductId === campaignVoucherProductId
      );
    }
    return found || null;
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
            disabled={loading}
          >
            <option value="">-- Select Campaign --</option>
            {campaigns.map(campaign => (
              <option key={campaign.id || campaign.Id} value={campaign.id || campaign.Id}>
                {campaign.name || campaign.Name || `Campaign ${campaign.id || campaign.Id}`}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        {selectedCampaignId && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Products to Give on Voucher Redemption</h2>
            
            {loading ? (
              <div className="text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Loading voucher products...
              </div>
            ) : voucherProducts.length === 0 ? (
              <div className="text-gray-500 p-4 bg-gray-50 rounded border">
                No voucher redemption products found for this campaign.
              </div>
            ) : (
              <div className="space-y-2">
                {voucherProducts.map((voucherProduct, index) => {
                  const product = getProductDetails(voucherProduct);
                  const productId = voucherProduct.ProductId || voucherProduct.productId || voucherProduct.product_id;
                  const voucherValue = voucherProduct.VoucherValue || voucherProduct.voucherValue || voucherProduct.voucher_value;
                  const isActive = voucherProduct.IsActive !== undefined ? voucherProduct.IsActive : voucherProduct.isActive;
                  
                  return (
                    <div 
                      key={voucherProduct.Id || voucherProduct.id || index} 
                      className="border rounded p-3 bg-gray-50"
                    >
                      <div className="font-medium">
                        {product ? (
                          <>
                            {product.Name || product.name}
                            {(product.Brand || product.brand) && (
                              <span className="text-gray-600"> ({product.Brand || product.brand})</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Product ID: {productId} (Product details not found)
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        {voucherValue !== undefined && (
                          <span className="mr-4">Voucher Value: ₹{voucherValue}</span>
                        )}
                        {isActive !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                      
                      {/* Debug info - remove in production */}
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                        <pre className="text-xs text-gray-400 mt-1 overflow-auto">
                          {JSON.stringify(voucherProduct, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibleProducts;