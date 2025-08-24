import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []); // Fetch all notifications once

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reseller/notification'); // Fetch all notifications
            setNotifications(response.data.items || response.data); // Adjust based on API response structure
            setTotalCount(response.data.totalCount || response.data.length); // Adjust based on API response structure
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/reseller/notification/mark-as-read');
            // After marking as read, re-fetch notifications to update their status
            fetchNotifications(); 
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={markAllAsRead}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Mark all as read
                </button>
                <p className="text-gray-600">Total Notifications: {totalCount}</p>
            </div>
            {loading ? (
                <p>Loading notifications...</p>
            ) : (
                <>
                    <ul className="space-y-4 mb-4">
                        {notifications.length === 0 ? (
                            <p className="text-gray-600">No notifications to display.</p>
                        ) : (
                            notifications.map(notification => (
                                <li
                                    key={notification.id}
                                    className={`p-4 rounded-lg ${
                                        notification.isRead ? 'bg-gray-200' : 'bg-white shadow'
                                    }`}
                                >
                                    <p className="text-gray-800">{notification.message}</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </li>
                            ))
                        )}
                    </ul>
                    
                </>
            )}
        </div>
    );
};

export default Notifications;
