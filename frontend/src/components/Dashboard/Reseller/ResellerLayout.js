import React from 'react';
import ResellerSidebar from './ResellerSidebar';


const ResellerLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-1 gap-x-4">
        <ResellerSidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pl-64">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResellerLayout; 