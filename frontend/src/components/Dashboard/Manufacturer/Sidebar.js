import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlusCircleIcon,
  QrCodeIcon,
  UserGroupIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/manufacturer/dashboard', icon: HomeIcon },
    { name: 'Create Campaign', href: '/manufacturer/campaign/create', icon: PlusCircleIcon },
    { name: 'QR Codes', href: '/manufacturer/qr-codes', icon: QrCodeIcon },
    { name: 'Assign Reseller', href: '/manufacturer/assign-reseller', icon: UserGroupIcon },
    { name: 'Analytics', href: '/manufacturer/analytics', icon: ChartBarIcon },
    { name: 'Manage Resellers', href: '/manufacturer/resellers', icon: UsersIcon },
    { name: 'Settings', href: '/manufacturer/settings', icon: CogIcon },
    { name: 'Help', href: '/manufacturer/help', icon: QuestionMarkCircleIcon },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b px-4">
        <h2 className="text-xl font-semibold text-gray-800">Manufacturer Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-6 w-6 flex-shrink-0 ${
                  isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 