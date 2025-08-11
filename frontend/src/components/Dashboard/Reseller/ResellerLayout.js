import React from 'react';
import ResellerSidebar from './ResellerSidebar';


const ResellerLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-1">
        <ResellerSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResellerLayout; 