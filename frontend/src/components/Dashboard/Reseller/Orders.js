import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaEye, FaDownload, FaCalculator, FaStar } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculatingPoints, setCalculatingPoints] = useState(false);
  const [syncingPoints, setSyncingPoints] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { user } = useAuth();
  const resellerId = user?.id || 1;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
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
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const showOrderDetails = (order) => {
    console.log("Showing order details for:", order);
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
    setShowDetailsModal(false);
  };

  const calculatePoints = async () => {
    try {
      setCalculatingPoints(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/calculate-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully calculated points for ${result.totalOrdersUpdated} orders. Total points: ${result.totalPointsCalculated}`);
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error calculating points:', err);
      alert('Failed to calculate points');
    } finally {
      setCalculatingPoints(false);
    }
  };

  const syncCampaignPoints = async () => {
    try {
      setSyncingPoints(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/order/sync-campaign-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully synced points for ${result.totalCampaignsUpdated} campaigns.`);
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error syncing campaign points:', err);
      alert('Failed to sync campaign points');
    } finally {
      setSyncingPoints(false);
    }
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


  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const currentOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
            <p className="text-sm text-gray-600 mt-1">View and manage your orders</p>
          </div>
          
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <FaShoppingCart className="text-xl" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <FaStar className="text-xl" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Points Earned</p>
              <p className="text-xl font-bold text-gray-900">
                {orders.reduce((sum, order) => sum + (order.totalPointsEarned || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <span className="text-xl">💰</span>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Value</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <span className="text-xl">📦</span>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending Orders</p>
              <p className="text-xl font-bold text-gray-900">
                {orders.filter(order => order.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Order History</h2>
          <p className="text-gray-600 mt-1">Orders from your existing system</p>
        </div>
        
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Earned
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.orderItems?.length || 0} items
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.campaign?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.campaign?.manufacturer?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        +{order.totalPointsEarned || 0} points
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => showOrderDetails(order)} className="text-blue-600 hover:text-blue-900">
                          <FaEye className="text-base" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <FaDownload className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <FaShoppingCart className="text-6xl mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">Orders from your existing system will appear here</p>
          </div>
        )}

        {/* Pagination Controls */}
        {orders.length > itemsPerPage && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
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

            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-600"><span className="font-semibold">Campaign:</span> {selectedOrder.campaign?.name || 'N/A'}</p>
                <p className="text-gray-600"><span className="font-semibold">Manufacturer:</span> {selectedOrder.campaign?.manufacturer?.name || 'N/A'}</p>
                <p className="text-gray-600"><span className="font-semibold">Order Date:</span> {formatDate(selectedOrder.orderDate)}</p>
                <p className="text-gray-600"><span className="font-semibold">Total Amount:</span> ₹{selectedOrder.totalAmount?.toLocaleString() || '0'}</p>
                <p className="text-gray-600"><span className="font-semibold">Points Earned:</span> {selectedOrder.totalPointsEarned || 0}</p>
                <p className="text-gray-600"><span className="font-semibold">Status:</span> <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                {selectedOrder.shippingAddress && <p className="text-gray-600"><span className="font-semibold">Shipping Address:</span> {selectedOrder.shippingAddress}</p>}
                {selectedOrder.notes && <p className="text-gray-600"><span className="font-semibold">Notes:</span> {selectedOrder.notes}</p>}
              </div>

              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Ordered Products:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedOrder.orderItems.map(item => (
                      <li key={item.id} className="text-gray-700">
                        {item.productName} (Quantity: {item.quantity})
                      </li>
                    ))}
                  </ul>
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
    </div>
  );
};

export default Orders;
