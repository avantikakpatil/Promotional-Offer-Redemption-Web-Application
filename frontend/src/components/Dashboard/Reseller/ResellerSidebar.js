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
    <div className="fixed h-full w-63 bg-white shadow-lg z-30">
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
                {item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ResellerSidebar; 