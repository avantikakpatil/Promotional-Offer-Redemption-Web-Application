import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ShopkeeperSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/shopkeeper/dashboard/', icon: '🏠' },
    { name: 'QR Scanner', path: '/shopkeeper/dashboard/scanner', icon: '📱' },
    { name: 'Redemption History', path: '/shopkeeper/dashboard/history', icon: '📋' },
    { name: 'Eligible Products', path: '/shopkeeper/dashboard/products', icon: '🛍️' },
    { name: 'Settings', path: '/shopkeeper/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">Shopkeeper Portal</h2>
        <p className="text-gray-600 text-sm mt-1">Redeem vouchers & manage sales</p>
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

export default ShopkeeperSidebar; 