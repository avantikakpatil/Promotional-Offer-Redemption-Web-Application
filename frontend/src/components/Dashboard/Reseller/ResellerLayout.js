import React from 'react';
import ResellerSidebar from './ResellerSidebar';

const ResellerLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <ResellerSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
};

export default ResellerLayout; 