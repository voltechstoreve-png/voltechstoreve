'use client';


import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function PanelTiendaLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  console.log('🔍 PanelTiendaLayout renderizando');
  console.log(' sidebarOpen:', sidebarOpen);

  return (
    <div className="flex h-screen bg-voltech-dark overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}