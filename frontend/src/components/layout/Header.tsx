import { Menu, Bell, User, LogOut, Moon, Sun, ChevronRight, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import EstateSwitcher from './EstateSwitcher';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { activeEstate } = useEstate();
  const { estateSlug } = useParams<{ estateSlug?: string }>();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed w-full top-0 z-50">
      <div className="bg-card text-card-foreground border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-2 lg:ml-0 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <h1 className="font-display text-2xl leading-none tracking-tight text-foreground">
                  Native Estate
                </h1>
                {user?.organizationName && (
                  <span className="hidden md:inline-block ml-2 pl-2 border-l border-border text-sm text-muted-foreground">
                    {user.organizationName}
                  </span>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user?.isOrgStaff && <EstateSwitcher />}

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-destructive rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg border border-border shadow-lg py-1 z-20">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="badge badge-primary">
                            {user?.isOrgStaff ? user?.orgRole : user?.estateRole}
                          </span>
                        </p>
                      </div>
                      {estateSlug && (
                        <Link
                          to={`/e/${estateSlug}/profile`}
                          className="block px-4 py-2 text-sm hover:bg-accent/10"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile Settings
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent/10 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estate context bar -- staff only */}
      {user?.isOrgStaff && (
        <div className="bg-secondary/60 border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 h-10 flex items-center text-sm">
            <Link
              to="/portfolio"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Portfolio</span>
            </Link>
            {activeEstate && (
              <>
                <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{activeEstate.name}</span>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
