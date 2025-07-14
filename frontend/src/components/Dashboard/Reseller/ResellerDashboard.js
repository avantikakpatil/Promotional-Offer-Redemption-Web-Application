import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ResellerLayout from './ResellerLayout';
import ResellerHome from './ResellerHome';
import Campaigns from './Campaigns';
import Points from './Points';
import Vouchers from './Vouchers';
import QRCodeManagement from './QRCodeManagement';
import RedemptionHistory from './RedemptionHistory';
import Settings from './Settings';
import QRScanPage from './QRScanPage';

const ResellerDashboard = () => {
  return (
    <ResellerLayout>
      <Routes>
        <Route path="/" element={<ResellerHome />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/points" element={<Points />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/qr-codes" element={<QRCodeManagement />} />
        <Route path="/qr-scan" element={<QRScanPage />} />
        <Route path="/history" element={<RedemptionHistory />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ResellerLayout>
  );
};

export default ResellerDashboard;
