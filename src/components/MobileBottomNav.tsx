
import { Home, FileText, Users, Package, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Quotes', path: '/quotes' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Package, label: 'Items', path: '/items' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Only hide if scrolling down and past threshold (50px)
          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Haptic feedback helper
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      // Short, subtle vibration (10ms)
      navigator.vibrate(10);
    }
  };

  const handleNavigation = (path: string) => {
    triggerHapticFeedback();
    navigate(path);
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t lg:hidden z-50 h-16",
        "transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      data-demo="mobile-bottom-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-full">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                'transition-all duration-200 ease-in-out',
                'min-w-[44px] min-h-[44px]', // WCAG touch target size
                'active:scale-95', // Press feedback
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
