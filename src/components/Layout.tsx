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
  const { signOut, userRole, user } = useAuth();
  const { unreadCount, markAllAsRead } = useNotificationsSystem();
  const [companyLogo, setCompanyLogo] = useState<string>();

  // Load company logo for dynamic favicon
  useEffect(() => {
    if (user?.id) {
      getSettings(user.id).then(settings => {
        if (settings.logo) {
          setCompanyLogo(settings.logo);
        }
      }).catch(console.error);
    }
  }, [user?.id]);

  // Apply dynamic favicon for Max AI tier
  useDynamicFavicon(companyLogo);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container px-4">
          {/* Desktop: Single Row */}
          <div className="hidden md:flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Quote-it AI" className="h-10 w-auto" />
              <h1 className="text-xl font-bold">Quote-it AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/help')}
                className="rounded-full"
                title="Help & Support"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await markAllAsRead();
                  navigate('/quotes?filter=notifications');
                }}
                className="rounded-full relative"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
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
                title="Toggle theme"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="rounded-full"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile: Two Rows */}
          <div className="md:hidden py-2">
            {/* Row 1: Logo + Title + Core Actions */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Quote-it AI" className="h-8 w-auto" />
                <h1 className="text-lg font-bold">Quote-it AI</h1>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await markAllAsRead();
                    navigate('/quotes?filter=notifications');
                  }}
                  className="rounded-full h-9 w-9 relative"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full h-9 w-9"
                  title="Toggle theme"
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="rounded-full h-9 w-9"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
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
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
              <SyncIndicator />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 md:ml-64 overflow-x-hidden max-w-full">
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card">
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
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed left-0 top-14 bottom-0 w-64 border-r bg-card">
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
              >
                <Icon className="mr-2 h-5 w-5" />
                {item.name}
              </Button>
            );
          })}
          {/* Developer Tools Section - Admin Only */}
          {userRole === 'admin' && (
            <div className="mt-auto pt-4 border-t">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-3">Developer Tools</div>
              {devNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => navigate(item.path)}
                    className="justify-start"
                  >
                    <Icon className="mr-2 h-5 w-5" />
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
