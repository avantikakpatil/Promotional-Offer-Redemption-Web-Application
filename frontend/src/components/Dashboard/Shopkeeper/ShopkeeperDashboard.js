import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ShopkeeperLayout from './ShopkeeperLayout';
import QRScanner from './QRScanner';
import RedemptionHistory from './RedemptionHistory';
import Settings from './Settings';

const ShopkeeperDashboard = () => {
  return (
    <ShopkeeperLayout>
      <Routes>
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="/history" element={<RedemptionHistory />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ShopkeeperLayout>
  );
};

export default ShopkeeperDashboard; 