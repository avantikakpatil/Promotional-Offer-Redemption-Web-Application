import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  QrCodeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Active Campaigns',
    value: '12',
    icon: ChartBarIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Total QR Codes',
    value: '1,234',
    icon: QrCodeIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Active Resellers',
    value: '8',
    icon: UserGroupIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'Total Redemptions',
    value: '456',
    icon: CurrencyDollarIcon,
    color: 'bg-yellow-500',
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'Campaign Created',
    description: 'Summer Promotion 2024',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    type: 'QR Codes Generated',
    description: '500 codes for Winter Campaign',
    timestamp: '5 hours ago',
  },
  {
    id: 3,
    type: 'Reseller Assigned',
    description: 'John Doe assigned to Summer Campaign',
    timestamp: '1 day ago',
  },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back!</h1>
        <div className="flex space-x-4">
          <Link
            to="/manufacturer/campaign/create"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Campaign
          </Link>
          <Link
            to="/manufacturer/analytics"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <div className="flex items-center">
              <div className={`rounded-md ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    {stat.name}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type}
                    </p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="text-sm text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 