import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Megaphone,
  Calendar,
  Droplet,
  Wrench,
  Building,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'] },
    { name: 'Documents', href: '/documents', icon: FileText, roles: ['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'] },
    { name: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'] },
    { name: 'Meetings', href: '/meetings', icon: Calendar, roles: ['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'] },
    { name: 'Utilities', href: '/utilities', icon: Droplet, roles: ['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'] },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT'] },
    { name: 'Properties', href: '/properties', icon: Building, roles: ['DIRECTOR', 'MANAGER'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['DIRECTOR', 'MANAGER'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen pt-20 transition-transform bg-white border-r border-gray-200 lg:translate-x-0 w-64',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>

        <nav className="px-3 pb-4 overflow-y-auto h-full">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      'flex items-center p-2 rounded-lg group transition-colors',
                      isActive(item.href)
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-5 h-5',
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-gray-500 group-hover:text-gray-900'
                      )}
                    />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
