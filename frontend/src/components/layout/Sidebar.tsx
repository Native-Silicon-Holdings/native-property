import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Home,
  FileText,
  Megaphone,
  Calendar,
  Droplet,
  Wrench,
  Building2,
  Wallet,
  Landmark,
  Vote,
  Users,
  LayoutGrid,
  X,
} from 'lucide-react';
import { useAuth, EstateRole } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  /** Estate roles allowed to see this item, in addition to org staff. Omit for "everyone". */
  roles?: EstateRole[];
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { estateSlug } = useParams<{ estateSlug?: string }>();

  const isActive = (path: string) => location.pathname.startsWith(path);
  const base = estateSlug ? `/e/${estateSlug}` : '';

  const navigation: NavItem[] = [
    { name: 'Home', href: `${base}/home`, icon: Home },
    { name: 'Documents', href: `${base}/documents`, icon: FileText },
    { name: 'Announcements', href: `${base}/announcements`, icon: Megaphone },
    { name: 'Meetings', href: `${base}/meetings`, icon: Calendar },
    { name: 'Utilities', href: `${base}/utilities`, icon: Droplet },
    { name: 'Maintenance', href: `${base}/maintenance`, icon: Wrench, roles: ['DIRECTOR', 'HOMEOWNER', 'TENANT'] },
    { name: 'Units', href: `${base}/units`, icon: Building2, roles: ['DIRECTOR'] },
    { name: 'Financial', href: `${base}/financial`, icon: Wallet, roles: ['DIRECTOR', 'ACCOUNTANT'] },
    { name: 'Directors', href: `${base}/directors`, icon: Landmark },
    { name: 'Elections', href: `${base}/elections`, icon: Vote },
    { name: 'Users', href: `${base}/users`, icon: Users, roles: ['DIRECTOR'] },
  ];

  // Org staff can always manage; residents are gated by their estate role.
  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    if (user?.isOrgStaff) return true;
    return !!user?.estateRole && item.roles.includes(user.estateRole);
  };

  const filteredNavigation = estateSlug ? navigation.filter(canSee) : [];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/60 lg:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-estate bg-card border-r border-border lg:translate-x-0 w-64',
          user?.isOrgStaff ? 'pt-[104px]' : 'pt-20',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>

        <nav className="px-3 pb-4 overflow-y-auto h-full">
          {user?.isOrgStaff && (
            <Link
              to="/portfolio"
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center p-2 mb-2 rounded-lg group transition-colors',
                location.pathname === '/portfolio'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="ml-3 font-medium">Portfolio</span>
            </Link>
          )}

          {!estateSlug && user?.isOrgStaff && (
            <p className="px-2 py-3 text-xs text-muted-foreground leading-relaxed">
              Open an estate from Portfolio to see units, maintenance, and governance.
            </p>
          )}

          {!estateSlug && !user?.isOrgStaff && (
            <p className="px-2 py-3 text-xs text-muted-foreground leading-relaxed">
              No estate selected. If this persists, you may not have estate membership yet.
            </p>
          )}

          <ul className="space-y-1">
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
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent/10'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-5 h-5',
                        isActive(item.href)
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
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
