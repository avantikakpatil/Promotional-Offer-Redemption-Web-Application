import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, CheckCircle, X, Plus, Minus, Info, RefreshCw, AlertTriangle, Package } from 'lucide-react';

const OrderProducts = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    fetchEligibleProducts();
  }, []);

  const isCampaignExpired = (campaign) => {
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    return endDate < now;
  };

  const fetchEligibleProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch('/api/reseller/order/eligible-products', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched eligible products:', data); // Debug log

      const activeCampaigns = (data.campaigns || []).filter(campaignGroup => {
        return !isCampaignExpired(campaignGroup.campaign);
      });

      setCampaigns(activeCampaigns);
    } catch (err) {
      console.error('Error fetching eligible products:', err);
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, campaignId) => {
    const existingItem = cart.find(item => item.eligibleProductId === product.eligibleProductId);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.eligibleProductId === product.eligibleProductId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        eligibleProductId: product.eligibleProductId,
        campaignId: campaignId,
        productName: product.name,
        unitPrice: product.basePrice,
        pointsPerUnit: product.pointCost, // CHANGED from product.pointsPerUnit
        quantity: 1,
      }]);
    }
  };

  const removeFromCart = (eligibleProductId) => {
    setCart(cart.filter(item => item.eligibleProductId !== eligibleProductId));
  };

  const updateQuantity = (eligibleProductId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.eligibleProductId === eligibleProductId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };

  const getCartPoints = () => {
    return cart.reduce((total, item) => total + (item.pointsPerUnit * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      setOrderError('Please add items to your cart before placing an order.');
      return;
    }

    try {
      setSubmitting(true);
      setOrderError('');
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Calculate totalAmount and totalPointsEarned on frontend for accuracy
      const totalAmount = cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
      const totalPointsEarned = cart.reduce((total, item) => total + (item.pointsPerUnit * item.quantity), 0);

      const orderRequest = {
        items: cart.map(item => ({
          eligibleProductId: item.eligibleProductId,
          campaignId: item.campaignId,
          quantity: item.quantity,
        })),
        totalAmount, // send to backend for validation
        totalPointsEarned, // send to backend for validation
      };

      // Log detailed order request for debugging
      console.log('Submitting order request:', {
        itemCount: orderRequest.items.length,
        items: orderRequest.items,
        totalAmount,
        totalPointsEarned,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch('/api/reseller/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderRequest),
      });

      console.log('Order response status:', response.status);
      console.log('Order response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          console.log('Order error response:', errorData);
          
          // Handle Entity Framework specific errors
          if (errorData.error && errorData.error.includes('entity changes')) {
            errorMessage = 'Database error: Failed to save order. This may be due to:';
            errorDetails = [
              '• Invalid product or campaign IDs',
              '• Database constraint violations',
              '• Concurrent access issues',
              '• Required fields missing in backend',
            ];
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
          
          // Add any additional details
          if (errorData.details) {
            errorDetails = errorDetails || [];
            errorDetails.push(`Backend details: ${JSON.stringify(errorData.details)}`);
          }
          
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status}). Unable to parse error details.`;
        }
        
        // Create comprehensive error message
        if (errorDetails) {
          errorMessage += '\n\n' + errorDetails.join('\n');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Order success response:', result); // Debug log
      
      // Overwrite orderResult with correct values from frontend if backend does not return them
      setOrderResult({
        ...result,
        order: {
          ...result.order,
          totalAmount: result.order?.totalAmount ?? totalAmount,
          totalPointsEarned: result.order?.totalPointsEarned ?? totalPointsEarned,
        },
      });
      setShowSuccess(true);
      setCart([]); // Clear cart
      
      // Refresh products to update availability
      await fetchEligibleProducts();
      
      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setOrderError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getProductStatus = (product) => {
    if (!product.isActive) return { text: 'Inactive', color: 'text-red-600' };
    if (product.redemptionLimit && product.redemptionLimit <= 0) return { text: 'Limit Reached', color: 'text-red-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Order Products</h1>
            <p className="text-gray-600 mt-2">Order eligible products from your approved campaigns</p>
          </div>
          <button
            onClick={fetchEligibleProducts}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && orderResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircle className="text-green-600 text-2xl mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">Order Placed Successfully! 🎉</h3>
              <div className="text-green-700 mt-2 space-y-1">
                <p><strong>Order ID:</strong> #{orderResult.order?.id}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(orderResult.order?.totalAmount || 0)}</p>
                <p><strong>Points Earned:</strong> {orderResult.order?.totalPointsEarned || 0} points</p>
                {orderResult.order?.estimatedDelivery && (
                  <p><strong>Estimated Delivery:</strong> {new Date(orderResult.order.estimatedDelivery).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-600 hover:text-green-800 ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Order Error Message */}
      {orderError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="text-red-600 text-xl mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800">Order Failed</h3>
              <div className="text-red-700 mt-2">
                {orderError.split('\n').map((line, index) => (
                  <div key={index} className={index === 0 ? 'font-medium' : 'text-sm mt-1'}>
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Troubleshooting Steps:</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>1. Try refreshing the page and attempting the order again</div>
                  <div>2. Check if the products are still available</div>
                  <div>3. Try ordering one item at a time to identify problematic products</div>
                  <div>4. Contact support if the issue persists</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOrderError('')}
              className="text-red-600 hover:text-red-800 ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading eligible products...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <button 
              onClick={fetchEligibleProducts}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {campaigns.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Package className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No eligible products found</h3>
                <p className="text-gray-600 mb-4">You don't have any approved campaigns with eligible products.</p>
                <button
                  onClick={fetchEligibleProducts}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Products
                </button>
              </div>
            ) : (
              campaigns.map((campaignGroup) => (
                <div key={campaignGroup.campaign.id} className="bg-white rounded-lg shadow-lg">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{campaignGroup.campaign.name}</h2>
                        <p className="text-gray-600 mt-1">{campaignGroup.campaign.description}</p>
                        {campaignGroup.campaign.manufacturer && (
                          <p className="text-sm text-gray-500 mt-1">
                            By: {campaignGroup.campaign.manufacturer.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {campaignGroup.products?.length || 0} products
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {!campaignGroup.products || campaignGroup.products.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-gray-600">No products available in this campaign</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaignGroup.products.map((product) => {
                          const status = getProductStatus(product);
                          const isCampaignActive = !isCampaignExpired(campaignGroup.campaign); // Reuse the function
                          const isAvailable = product.isActive && (!product.redemptionLimit || product.redemptionLimit > 0) && isCampaignActive;
                          
                          return (
                            <div key={product.eligibleProductId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {product.brand} {product.category && `• ${product.category}`}
                                  </p>
                                  {product.sku && <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>}
                                </div>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${ 
                                  status.text === 'Available' ? 'bg-green-100 text-green-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {status.text}
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Price:</span>
                                  <span className="font-semibold">{formatCurrency(product.basePrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Points per unit:</span>
                                  <span className="font-semibold text-blue-600">{product.pointCost} pts</span> {/* CHANGED from product.pointsPerUnit */}
                                </div>
                                {product.redemptionLimit && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Redemption limit:</span>
                                    <span className="font-semibold">{product.redemptionLimit}</span>
                                  </div>
                                )}
                                {product.description && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => addToCart(product, campaignGroup.campaign.id)}
                                disabled={!isAvailable || !isCampaignActive}
                                className={`w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${ 
                                  isAvailable && isCampaignActive
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}>
                                <Plus size={16} className="mr-2" />
                                Add to Cart
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <ShoppingCart className="mr-2" size={20} />
                  Shopping Cart
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                </p>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-1">Add products to get started</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.eligibleProductId} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 text-sm">{item.productName}</h4>
                              <p className="text-xs text-gray-600">{formatCurrency(item.unitPrice)} each</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.eligibleProductId)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove from cart"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.eligibleProductId, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.eligibleProductId, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                              <p className="text-xs text-blue-600">{item.pointsPerUnit * item.quantity} pts</p> {/* This will now use pointCost */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(getCartTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Points to earn:</span>
                        <span className="font-semibold text-blue-600">{getCartPoints()} pts</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(getCartTotal())}</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={submitOrder}
                      disabled={submitting || cart.length === 0}
                      className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2" size={16} />
                          Place Order
                        </>
                      )}
                    </button>

                    {/* Order Validation Info */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start">
                        <Info className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">Order Information:</p>
                          <ul className="space-y-1">
                            <li>• Points will be credited after order confirmation</li>
                            <li>• Delivery timeline depends on product availability</li>
                            <li>• You'll receive order updates via email/SMS</li>
                          </ul>
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="font-medium mb-1">Debug Info:</p>
                            <div className="text-xs">
                              <div>Items: {cart.length}</div>
                              <div>Product IDs: {cart.map(item => item.eligibleProductId).join(', ')}</div>
                              <div>Campaign IDs: {[...new Set(cart.map(item => item.campaignId))].join(', ')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderProducts;