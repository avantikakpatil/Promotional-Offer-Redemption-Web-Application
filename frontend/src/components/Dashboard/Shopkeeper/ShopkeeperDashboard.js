import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ShopkeeperLayout from './ShopkeeperLayout';
import QRScanner from './QRScanner';
import RedemptionHistory from './RedemptionHistory';
import Settings from './Settings';
import ShopkeeperHome from './ShopkeeperHome';
import EligibleProducts from './EligibleProducts';

const ShopkeeperDashboard = () => {
  // Add a state to trigger history refresh
  const [historyRefreshKey, setHistoryRefreshKey] = React.useState(0);

  // Callback to trigger history refresh
  const handleRedeem = () => {
    setHistoryRefreshKey(prev => prev + 1);
  };

  return (
    <ShopkeeperLayout>
      <Routes>
        <Route path="/" element={<ShopkeeperHome />} />
        <Route path="/scanner" element={<QRScanner onRedeem={handleRedeem} />} />
        <Route path="/history" element={<RedemptionHistory key={historyRefreshKey} />} />
        <Route path="/products" element={<EligibleProducts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ShopkeeperLayout>
  );
};

export default ShopkeeperDashboard; 