import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ShopkeeperLayout from './ShopkeeperLayout';
import ShopkeeperHome from './ShopkeeperHome';
import QRScanner from './QRScanner';
import RedemptionHistory from './RedemptionHistory';
import EligibleProducts from './EligibleProducts';
import Settings from './Settings';

const ShopkeeperDashboard = () => {
  return (
    <ShopkeeperLayout>
      <Routes>
        <Route path="/" element={<ShopkeeperHome />} />
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="/history" element={<RedemptionHistory />} />
        <Route path="/products" element={<EligibleProducts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ShopkeeperLayout>
  );
};

export default ShopkeeperDashboard; 