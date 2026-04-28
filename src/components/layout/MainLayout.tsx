import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">FairHire Engine Recruitment Platform</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search..." className="bg-gray-100 border-none rounded-full px-4 py-2 text-xs w-48 focus:ring-1 focus:ring-black outline-none" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
              <div className="bg-blue-500 w-full h-full"></div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
