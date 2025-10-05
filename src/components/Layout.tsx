import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Package, FileText, Settings, Moon, Sun, CreditCard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Quotes', path: '/quotes', icon: FileText },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Items', path: '/items', icon: Package },
  { name: 'Subscription', path: '/subscription', icon: CreditCard },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Quote-it AI" className="h-8 w-8 rounded" />
            <h1 className="text-xl font-bold">Quote-it AI</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6 md:ml-64 w-full max-w-full overflow-x-hidden">
        {children}
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
        </div>
      </nav>

    </div>
  );
}
