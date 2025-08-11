import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ResellerSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/reseller/dashboard', icon: '📊' },
    { name: 'Campaigns', path: '/reseller/dashboard/campaigns', icon: '🎯' },
    { name: 'Order Products', path: '/reseller/dashboard/order-products', icon: '🛒' },
    { name: 'Orders', path: '/reseller/dashboard/orders', icon: '📋' },
    { name: 'My Points', path: '/reseller/dashboard/points', icon: '⭐' },
    { name: 'Vouchers', path: '/reseller/dashboard/vouchers', icon: '🎫' },
    { name: 'Order History', path: '/reseller/dashboard/history', icon: '📋' },
    { name: 'Settings', path: '/reseller/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">Reseller Portal</h2>
        <p className="text-gray-600 text-sm mt-1">Manage your business</p>
      </div>
      
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  location.pathname === item.path ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ResellerSidebar; 