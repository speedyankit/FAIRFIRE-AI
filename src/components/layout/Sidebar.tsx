import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, ScanSearch, BarChart4, Settings, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/AppContext';

export function Sidebar() {
  const { user, login, logout, authLoading } = useAppStore();

  const links = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Upload Resume', to: '/upload', icon: FileText },
    { name: 'JD Scanner', to: '/jd-scanner', icon: ScanSearch },
    { name: 'Bias Report', to: '/bias-report', icon: BarChart4 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col shrink-0 font-sans min-h-screen">
      <div className="mb-8 flex items-center gap-2">
        <Link to="/" className="text-xl font-bold tracking-tight text-[#1A1A1A] flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          FAIRHIRE AI
        </Link>
      </div>

      <div className="mb-8 flex-1">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Navigation</h3>
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    )
                  }
                >
                  <Icon size={18} />
                  {link.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Account</h3>
        <ul className="space-y-1 mb-4">
          {!authLoading && user ? (
            <>
              <li>
                <div className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-black bg-gray-50 mb-1">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User avatar" className="w-5 h-5 rounded-full" />
                  ) : (
                    <UserIcon size={18} />
                  )}
                  <span className="truncate">{user.displayName || user.email}</span>
                </div>
              </li>
              <li>
                <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md transition-colors text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <button disabled={authLoading} onClick={login} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md transition-colors text-sm font-medium text-black hover:bg-gray-100 border border-gray-200">
                <LogIn size={18} />
                {authLoading ? 'Loading...' : 'Sign in with Google'}
              </button>
            </li>
          )}
        </ul>

        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">System</h3>
        <ul className="space-y-1">
          <li>
            <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md transition-colors text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black">
              <Settings size={18} />
              Settings
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
