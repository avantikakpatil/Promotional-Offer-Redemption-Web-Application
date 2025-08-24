import React, { useState, useEffect } from 'react';
import  api  from '../../../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/manufacturer/notification');
                setNotifications(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const markAsRead = async () => {
        try {
            await api.post('/manufacturer/notification/mark-as-read');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <button
                onClick={markAsRead}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
            >
                Mark all as read
            </button>
            {loading ? (
                <p>Loading notifications...</p>
            ) : (
                <ul className="space-y-4">
                    {notifications.map(notification => (
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
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;
