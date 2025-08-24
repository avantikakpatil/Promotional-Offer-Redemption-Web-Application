import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ResellerLayout from './ResellerLayout';
import ResellerHome from './ResellerHome';
import Campaigns from './Campaigns';
import OrderProducts from './OrderProducts';
import Orders from './Orders';
import Points from './Points';
import Vouchers from './Vouchers';
import RedemptionHistory from './RedemptionHistory';
import Settings from './Settings';


const ResellerDashboard = () => {
  return (
    <ResellerLayout>
      <Routes>
        <Route path="/" element={<ResellerHome />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/order-products" element={<OrderProducts />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/points" element={<Points />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/history" element={<RedemptionHistory />} />
        <Route path="/settings" element={<Settings />} />
        
      </Routes>
    </ResellerLayout>
  );
};

export default ResellerDashboard;
