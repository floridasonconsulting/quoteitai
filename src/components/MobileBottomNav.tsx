import { Home, FileText, Users, Package, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Quotes', path: '/quotes' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Package, label: 'Items', path: '/items' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t lg:hidden z-50 h-16" data-demo="mobile-bottom-nav">
      <div className="flex items-center justify-around h-full">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
