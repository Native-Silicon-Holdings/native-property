import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';
import Header from './Header';
import Sidebar from './Sidebar';
import { EstateProvider } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Adaptive shell: org staff get the full sidebar + estate context bar; residents
 * get a lighter chrome with fewer nav items and no portfolio affordances.
 */
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <EstateProvider>
      <div className="min-h-screen bg-background font-sans">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main
            className={clsx(
              'flex-1 min-w-0 p-6 lg:p-8 lg:ml-64 transition-[margin] duration-300 ease-estate',
              user?.isOrgStaff ? 'mt-[104px]' : 'mt-16'
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </EstateProvider>
  );
};

export default Layout;
