  'use client';

  import { useState } from 'react';
  import Sidebar from '@/components/layout/Sidebar';
  import Header from '@/components/layout/Header';

  export default function PanelTiendaLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

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
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }