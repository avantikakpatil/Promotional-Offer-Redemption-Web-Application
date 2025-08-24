import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaTicketAlt, FaDownload, FaEye } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';

const RedemptionHistory = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [showRedemptionDetailsModal, setShowRedemptionDetailsModal] = useState(false);
  
  // Add missing state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [voucherRedemptions, setVoucherRedemptions] = useState([]);
  const [filter, setFilter] = useState('all');

  const { user } = useAuth();
  const resellerId = user?.id || 1;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      await Promise.all([
        fetchOrders(),
        fetchVoucherRedemptions()
      ]);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchVoucherRedemptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/redemption-history', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Parse RedeemedProducts JSON string into an object
        setVoucherRedemptions(data);
      }
    } catch (err) {
      console.error('Error fetching voucher redemptions:', err);
    }
  };

  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
    setShowOrderDetailsModal(false);
  };

  const showRedemptionDetails = (redemption) => {
    setSelectedRedemption(redemption);
    setShowRedemptionDetailsModal(true);
  };

  const closeRedemptionDetailsModal = () => {
    setSelectedRedemption(null);
    setShowRedemptionDetailsModal(false);
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredData = () => {
    const combinedData = [...orders, ...voucherRedemptions];
    
    // Sort by date in descending order
    combinedData.sort((a, b) => {
      const dateA = new Date(a.orderDate || a.redeemedAt);
      const dateB = new Date(b.orderDate || b.redeemedAt);
      return dateB - dateA;
    });

    if (filter === 'orders') return orders;
    if (filter === 'vouchers') return voucherRedemptions;
    return combinedData;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalVoucherRedemptions = voucherRedemptions.length;
  const totalPointsEarned = orders.reduce((sum, order) => sum + (order.totalPointsEarned || 0), 0);
  const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Order & Redemption History</h1>
        <p className="text-gray-600 mt-2">Track your orders and voucher redemptions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaShoppingCart className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaTicketAlt className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Voucher Redemptions</p>
              <p className="text-2xl font-bold text-gray-900">{totalVoucherRedemptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
              <p className="text-2xl font-bold text-gray-900">{totalPointsEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setFilter('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'orders' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Orders ({totalOrders})
          </button>
          <button
            onClick={() => setFilter('vouchers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'vouchers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Voucher Redemptions ({totalVoucherRedemptions})
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {getFilteredData().map((item, index) => (
          <div key={`${item.id || index}-${item.orderNumber || item.qrCode}`} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Order Item */}
              {item.orderNumber && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FaShoppingCart className="text-2xl mr-3 text-blue-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Order #{item.orderNumber}</h3>
                        <p className="text-sm text-gray-600">{item.campaign?.name || 'Unknown Campaign'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(item.orderDate)} • ₹{item.totalAmount?.toLocaleString() || '0'}
                          {item.totalPointsEarned && <span className="text-green-600"> • +{item.totalPointsEarned} points</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Product Details in Main View */}
                  {(item.orderItems || item.tempOrderPointsItems) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="text-sm">📦 Ordered Products</span>
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {(item.orderItems?.length || item.tempOrderPointsItems?.length || 0)} items
                        </span>
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {/* Display from orderItems */}
                        {item.orderItems && item.orderItems.map((orderItem, idx) => (
                          <div key={`order-${orderItem.id || idx}`} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-b-0">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-800">
                                {orderItem.productName || orderItem.product?.name || `Product ID: ${orderItem.productId}`}
                              </span>
                              {orderItem.product?.category && (
                                <span className="text-xs text-gray-500 ml-2">({orderItem.product.category})</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-600">Qty: <span className="font-semibold">{orderItem.quantity}</span></span>
                              {orderItem.unitPrice && (
                                <span className="text-gray-600">₹{orderItem.unitPrice.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Display from tempOrderPointsItems if orderItems not available */}
                        {!item.orderItems && item.tempOrderPointsItems && item.tempOrderPointsItems.map((tempItem, idx) => (
                          <div key={`temp-${tempItem.id || idx}`} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-b-0">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-800">
                                {tempItem.product?.name || `Product ID: ${tempItem.productId}`}
                              </span>
                              {tempItem.eligibleProductId && (
                                <span className="text-xs text-gray-500 ml-2">(Eligible: {tempItem.eligibleProductId})</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-600">Qty: <span className="font-semibold">{tempItem.quantity}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary row */}
                      <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-sm">
                        <span className="text-gray-600">
                          Total Items: <span className="font-semibold">
                            {(item.orderItems || item.tempOrderPointsItems || []).reduce((sum, orderItem) => sum + (orderItem.quantity || 0), 0)}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          Order Value: <span className="font-semibold">₹{item.totalAmount?.toLocaleString() || '0'}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voucher Redemption Item */}
              {item.qrCode && !item.orderNumber && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FaTicketAlt className="text-2xl mr-3 text-green-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Voucher Redemption</h3>
                        <p className="text-sm text-gray-600">QR: {item.qrCode}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(item.redeemedAt)} • ₹{item.redemptionValue?.toLocaleString() || '0'}
                          {item.pointsUsed && <span className="text-red-600"> • -{item.pointsUsed} points</span>}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Redeemed
                    </span>
                  </div>

                  {/* Redeemed Products in Main View */}
                  {item.redeemedProductDetails && item.redeemedProductDetails.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="text-sm">🎁 Redeemed Products</span>
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {item.redeemedProductDetails.length} items
                        </span>
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {item.redeemedProductDetails.map((product, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-green-200 last:border-b-0">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-800">
                                {product.Name || product.ProductName || 'Product Name N/A'}
                              </span>
                              {product.Category && (
                                <span className="text-xs text-gray-500 ml-2">({product.Category})</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              {product.Quantity && (
                                <span className="text-gray-600">Qty: <span className="font-semibold">{product.Quantity}</span></span>
                              )}
                              <span className="text-gray-600">₹{(product.RetailPrice || product.Value || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary row */}
                      <div className="mt-3 pt-2 border-t border-green-200 flex justify-between text-sm">
                        <span className="text-gray-600">
                          Total Products: <span className="font-semibold">{item.redeemedProductDetails.length}</span>
                        </span>
                        <span className="text-gray-600">
                          Redemption Value: <span className="font-semibold">₹{item.redemptionValue?.toLocaleString() || '0'}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {item.orderNumber ? (
                  <button onClick={() => showOrderDetails(item)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaEye className="inline mr-2" />
                    View Details
                  </button>
                ) : (
                  <button onClick={() => showRedemptionDetails(item)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaEye className="inline mr-2" />
                    View Details
                  </button>
                )}
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <FaDownload className="inline mr-2" />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {getFilteredData().length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No history found</h3>
          <p className="text-gray-600">There are no orders or redemptions matching your current filter.</p>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Order Details - {selectedOrder.orderNumber}</h2>
                <button
                  onClick={closeOrderDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Order Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600"><span className="font-semibold">Order Number:</span> {selectedOrder.orderNumber}</p>
                    <p className="text-gray-600"><span className="font-semibold">Campaign:</span> {selectedOrder.campaign?.name || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Manufacturer:</span> {selectedOrder.campaign?.manufacturer?.name || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Order Date:</span> {formatDate(selectedOrder.orderDate)}</p>
                    <p className="text-gray-600"><span className="font-semibold">Status:</span> <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Financial Details</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600"><span className="font-semibold">Total Amount:</span> ₹{selectedOrder.totalAmount?.toLocaleString() || '0'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Points Earned:</span> {selectedOrder.totalPointsEarned || 0}</p>
                    <p className="text-gray-600"><span className="font-semibold">GST Amount:</span> ₹{selectedOrder.gstAmount?.toLocaleString() || '0'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Net Amount:</span> ₹{selectedOrder.netAmount?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              {(selectedOrder.shippingAddress || selectedOrder.billingAddress || selectedOrder.notes) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>
                  <div className="space-y-2">
                    {selectedOrder.shippingAddress && <p className="text-gray-600"><span className="font-semibold">Shipping Address:</span> {selectedOrder.shippingAddress}</p>}
                    {selectedOrder.billingAddress && <p className="text-gray-600"><span className="font-semibold">Billing Address:</span> {selectedOrder.billingAddress}</p>}
                    {selectedOrder.notes && <p className="text-gray-600"><span className="font-semibold">Notes:</span> {selectedOrder.notes}</p>}
                  </div>
                </div>
              )}

              {/* Ordered Products */}
              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Ordered Products</h3>
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={item.id || index} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-800">{item.productName || item.product?.name || 'Product Name N/A'}</h4>
                            <p className="text-sm text-gray-600">Product ID: {item.productId || 'N/A'}</p>
                            {item.eligibleProductId && <p className="text-sm text-gray-600">Eligible Product ID: {item.eligibleProductId}</p>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">Quantity: {item.quantity}</p>
                            {item.unitPrice && <p className="text-sm text-gray-600">Unit Price: ₹{item.unitPrice.toLocaleString()}</p>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">Total: ₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</p>
                            {item.pointsEarned && <p className="text-sm text-green-600">Points: +{item.pointsEarned}</p>}
                          </div>
                        </div>
                        {item.description && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">Total Items:</span>
                      <span className="font-semibold">{selectedOrder.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-semibold text-gray-800">Total Amount:</span>
                      <span className="font-semibold text-lg">₹{selectedOrder.totalAmount?.toLocaleString() || '0'}</span>
                    </div>
                    {selectedOrder.totalPointsEarned && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold text-gray-800">Total Points Earned:</span>
                        <span className="font-semibold text-green-600">+{selectedOrder.totalPointsEarned}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TempOrderPoints Items Details */}
              {selectedOrder.tempOrderPointsItems && selectedOrder.tempOrderPointsItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Order Points Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item ID</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Product ID</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Eligible Product ID</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Quantity</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Order Points ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.tempOrderPointsItems.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-600">{item.id}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.productId}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.eligibleProductId || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 font-semibold">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.tempOrderPointsId || item.tempOrderPointsId1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={closeOrderDetailsModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Details Modal */}
      {showRedemptionDetailsModal && selectedRedemption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Redemption Details - {selectedRedemption.qrCode || selectedRedemption.voucherCode}</h2>
                <button
                  onClick={closeRedemptionDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Redemption Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Redemption Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600"><span className="font-semibold">Voucher Code:</span> {selectedRedemption.voucher?.voucherCode || selectedRedemption.voucherCode || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">QR Code:</span> {selectedRedemption.qrCode || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Campaign:</span> {selectedRedemption.campaign?.name || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Redeemed At:</span> {formatDate(selectedRedemption.redeemedAt)}</p>
                    <p className="text-gray-600"><span className="font-semibold">Redemption Type:</span> {selectedRedemption.redemptionType || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Value & Participants</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600"><span className="font-semibold">Redemption Value:</span> ₹{selectedRedemption.redemptionValue?.toLocaleString() || '0'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Points Used:</span> {selectedRedemption.pointsUsed || selectedRedemption.points || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Shopkeeper:</span> {selectedRedemption.shopkeeper?.name || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Reseller:</span> {selectedRedemption.reseller?.name || 'N/A'}</p>
                    <p className="text-gray-600"><span className="font-semibold">Voucher ID:</span> {selectedRedemption.voucherId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {(selectedRedemption.redemptionNotes || selectedRedemption.manufacturer) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>
                  <div className="space-y-2">
                    {selectedRedemption.manufacturer && <p className="text-gray-600"><span className="font-semibold">Manufacturer:</span> {selectedRedemption.manufacturer.name || selectedRedemption.manufacturer}</p>}
                    {selectedRedemption.redemptionNotes && <p className="text-gray-600"><span className="font-semibold">Notes:</span> {selectedRedemption.redemptionNotes}</p>}
                  </div>
                </div>
              )}

              {/* Redeemed Products */}
              {selectedRedemption.redeemedProductDetails && selectedRedemption.redeemedProductDetails.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Redeemed Products</h3>
                  <div className="space-y-3">
                    {selectedRedemption.redeemedProductDetails.map((product, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-800">{product.Name || 'Product Name N/A'}</h4>
                            {product.Description && <p className="text-sm text-gray-600 mt-1">{product.Description}</p>}
                            {product.Category && <p className="text-sm text-gray-600">Category: {product.Category}</p>}
                            {product.Brand && <p className="text-sm text-gray-600">Brand: {product.Brand}</p>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">Value: ₹{(product.RetailPrice || product.Value || 0).toLocaleString()}</p>
                            {product.Quantity && <p className="text-sm text-gray-600">Quantity: {product.Quantity}</p>}
                            {product.Points && <p className="text-sm text-green-600">Points: {product.Points}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Redemption Summary */}
                  <div className="bg-green-50 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">Total Products:</span>
                      <span className="font-semibold">{selectedRedemption.redeemedProductDetails.length}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-semibold text-gray-800">Total Redemption Value:</span>
                      <span className="font-semibold text-lg">₹{selectedRedemption.redemptionValue?.toLocaleString() || '0'}</span>
                    </div>
                    {selectedRedemption.pointsUsed && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold text-gray-800">Points Used:</span>
                        <span className="font-semibold text-red-600">-{selectedRedemption.pointsUsed}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={closeRedemptionDetailsModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedemptionHistory;