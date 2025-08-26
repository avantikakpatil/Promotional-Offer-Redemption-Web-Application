import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/reseller/notification');
            console.log('API Response:', response.data); // Debug log
            
            // Handle both possible response formats
            const items = response.data.items || response.data || [];
            const count = response.data.totalCount || items.length;
            
            setNotifications(items);
            setTotalCount(count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Failed to fetch notifications');
            setNotifications([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            setError(null);
            await api.post('/reseller/notification/mark-as-read');
            // Refresh notifications after marking as read
            await fetchNotifications();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            setError('Failed to mark notifications as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            setError(null);
            await api.delete(`/reseller/notification/${id}`);
            
            // Update state immediately for better UX
            const updatedNotifications = notifications.filter(n => n.id !== id);
            setNotifications(updatedNotifications);
            setTotalCount(prev => prev - 1);
            
        } catch (error) {
            console.error('Error deleting notification:', error);
            setError('Failed to delete notification');
            // Refresh notifications on error to ensure consistency
            await fetchNotifications();
        }
    };

    const deleteAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications?')) {
            return;
        }

        try {
            setError(null);
            await api.delete('/reseller/notification/delete-all');
            
            // Clear state immediately
            setNotifications([]);
            setTotalCount(0);
            
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            setError('Failed to delete all notifications');
            // Refresh notifications on error
            await fetchNotifications();
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Notifications</h2>
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Loading notifications...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                    <button 
                        onClick={() => setError(null)} 
                        className="ml-2 text-red-800 hover:text-red-900"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="space-x-2">
                    <button
                        onClick={markAllAsRead}
                        disabled={notifications.length === 0}
                        className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Mark all as read
                    </button>
                    <button
                        onClick={deleteAllNotifications}
                        disabled={notifications.length === 0}
                        className="bg-red-500 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Delete All
                    </button>
                </div>
                <p className="text-gray-600">Total Notifications: {totalCount}</p>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No notifications to display.</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-lg flex justify-between items-start border ${
                                notification.isRead 
                                    ? 'bg-gray-50 border-gray-200' 
                                    : 'bg-white border-blue-200 shadow-sm'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start">
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-gray-800 break-words">
                                            {notification.message}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteNotification(notification.id)}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded ml-4 flex-shrink-0 transition-colors"
                                title="Delete notification"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;