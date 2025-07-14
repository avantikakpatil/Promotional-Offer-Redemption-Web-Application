import React from 'react';
import ShopkeeperSidebar from './ShopkeeperSidebar';

const ShopkeeperLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <ShopkeeperSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
};

export default ShopkeeperLayout; 