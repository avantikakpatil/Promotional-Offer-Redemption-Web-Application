import React, { useState } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    companyName: 'Example Corp',
    contactName: 'John Smith',
    email: 'contact@example.com',
    phone: '+1234567890',
    address: '123 Business St, City, Country',
  });

  const [brandingData, setBrandingData] = useState({
    logo: null,
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    weeklyReports: true,
    campaignUpdates: true,
    resellerActivity: true,
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBrandingChange = (e) => {
    const { name, value } = e.target;
    setBrandingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBrandingData((prev) => ({
        ...prev,
        logo: URL.createObjectURL(file),
      }));
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to update profile
    console.log('Updating profile:', profileData);
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // TODO: Implement API call to update security settings
    console.log('Updating security settings:', securityData);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Company Profile
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`${
                activeTab === 'branding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Branding
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Notifications
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Company Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={profileData.companyName}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="contactName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  id="contactName"
                  value={profileData.contactName}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <textarea
                  name="address"
                  id="address"
                  rows={3}
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Logo
                </label>
                <div className="mt-1 flex items-center">
                  <div className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {brandingData.logo ? (
                      <img
                        src={brandingData.logo}
                        alt="Company logo"
                        className="h-28 w-28 object-contain"
                      />
                    ) : (
                      <span className="text-gray-500">No logo uploaded</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="ml-4"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="primaryColor"
                  className="block text-sm font-medium text-gray-700"
                >
                  Primary Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    name="primaryColor"
                    id="primaryColor"
                    value={brandingData.primaryColor}
                    onChange={handleBrandingChange}
                    className="h-8 w-8 rounded-md border border-gray-300"
                  />
                  <input
                    type="text"
                    value={brandingData.primaryColor}
                    onChange={handleBrandingChange}
                    className="ml-2 focus:ring-blue-500 focus:border-blue-500 block w-32 shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="secondaryColor"
                  className="block text-sm font-medium text-gray-700"
                >
                  Secondary Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    name="secondaryColor"
                    id="secondaryColor"
                    value={brandingData.secondaryColor}
                    onChange={handleBrandingChange}
                    className="h-8 w-8 rounded-md border border-gray-300"
                  />
                  <input
                    type="text"
                    value={brandingData.secondaryColor}
                    onChange={handleBrandingChange}
                    className="ml-2 focus:ring-blue-500 focus:border-blue-500 block w-32 shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={securityData.currentPassword}
                  onChange={handleSecurityChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={securityData.newPassword}
                  onChange={handleSecurityChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={securityData.confirmPassword}
                  onChange={handleSecurityChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="twoFactorEnabled"
                  id="twoFactorEnabled"
                  checked={securityData.twoFactorEnabled}
                  onChange={handleSecurityChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="twoFactorEnabled"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Enable Two-Factor Authentication
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Security Settings
                </button>
              </div>
            </form>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="emailAlerts"
                    id="emailAlerts"
                    checked={notificationSettings.emailAlerts}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="emailAlerts"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Email Alerts
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="weeklyReports"
                    id="weeklyReports"
                    checked={notificationSettings.weeklyReports}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="weeklyReports"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Weekly Reports
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="campaignUpdates"
                    id="campaignUpdates"
                    checked={notificationSettings.campaignUpdates}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="campaignUpdates"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Campaign Updates
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="resellerActivity"
                    id="resellerActivity"
                    checked={notificationSettings.resellerActivity}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="resellerActivity"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Reseller Activity
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 