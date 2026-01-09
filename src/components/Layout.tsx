import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Home, Users, Package, FileText, Settings, Moon, Sun, CreditCard, LogOut, HelpCircle, Activity, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { SyncIndicator } from '@/components/SyncIndicator';
import { useNotificationsSystem } from '@/hooks/useNotificationsSystem';
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon';
import { getSettings } from '@/lib/db-service';

interface LayoutProps {
  children?: ReactNode;
}

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Quotes', path: '/quotes', icon: FileText },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Items', path: '/items', icon: Package },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const devNavigation = [
  { name: 'Diagnostics', path: '/diagnostics', icon: Activity },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, userRole, user, organizationId } = useAuth();
  const { unreadCount, markAllAsRead } = useNotificationsSystem();
  const [companyLogo, setCompanyLogo] = useState<string>();

  // Load company logo for dynamic favicon
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        try {
          const userSettings = await getSettings(user.id, organizationId);
          if (userSettings.logo) {
            setCompanyLogo(userSettings.logo);
          }
        } catch (error) {
          console.error('[Layout] Error loading settings:', error);
        }
      }
    };
    loadSettings();
  }, [user?.id]);

  // Apply dynamic favicon for Max AI tier
  useDynamicFavicon(companyLogo);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      {/* Skip Navigation Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60" role="banner">
        <div className="container px-4">
          {/* Desktop: Single Row */}
          <div className="hidden md:flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Quote-it AI Logo" className="h-10 w-auto" />
              <h1 className="text-xl font-bold">Sellegance</h1>
            </div>
            <div className="flex items-center gap-2" role="toolbar" aria-label="Quick actions">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/help')}
                className="rounded-full"
                aria-label="Help and support"
              >
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await markAllAsRead();
                  navigate('/quotes?filter=notifications');
                }}
                className="rounded-full relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <SyncIndicator />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Sun className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="rounded-full"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Mobile: Two Rows */}
          <div className="md:hidden py-2">
            {/* Row 1: Logo + Title + Core Actions */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Quote-it AI Logo" className="h-8 w-auto" />
                <h1 className="text-lg font-bold">Sellegance</h1>
              </div>
              <div className="flex items-center gap-1" role="toolbar" aria-label="Quick actions">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await markAllAsRead();
                    navigate('/quotes?filter=notifications');
                  }}
                  className="rounded-full h-9 w-9 relative"
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                      aria-label={`${unreadCount} unread notifications`}
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full h-9 w-9"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="rounded-full h-9 w-9"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Row 2: Help + Sync Status */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/help')}
                className="gap-2"
                aria-label="Help and support"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                <span>Help</span>
              </Button>
              <SyncIndicator />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 px-4 py-6 md:ml-64 overflow-x-hidden max-w-full"
        role="main"
        aria-label="Main content"
      >
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav
        className="hidden md:block fixed left-0 top-14 bottom-0 w-64 border-r bg-card"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col gap-2 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => navigate(item.path)}
                className="justify-start"
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
                {item.name}
              </Button>
            );
          })}
          {/* Developer Tools Section - Admin Only */}
          {userRole === 'admin' && (
            <div className="mt-auto pt-4 border-t">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-3" role="heading" aria-level={2}>
                Developer Tools
              </div>
              {devNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => navigate(item.path)}
                    className="justify-start"
                    aria-label={item.name}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

    </div>
  );
}
