import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface DemoContextType {
    isDemoMode: boolean;
    setDemoMode: (enabled: boolean) => void;
    toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('quoteit_demo_mode');
        return saved === 'true';
    });

    const setDemoMode = (enabled: boolean) => {
        setIsDemoMode(enabled);
        localStorage.setItem('quoteit_demo_mode', String(enabled));

        if (enabled) {
            toast.success('Demo Mode Enabled', {
                description: 'Using mock data for Quotes, Customers, and Analytics.',
            });
        } else {
            toast.info('Demo Mode Disabled', {
                description: 'Returned to live database connection.',
            });
        }
    };

    const toggleDemoMode = () => setDemoMode(!isDemoMode);

    // Sync state across tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'quoteit_demo_mode') {
                setIsDemoMode(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return (
        <DemoContext.Provider value={{ isDemoMode, setDemoMode, toggleDemoMode }}>
            {children}
            {isDemoMode && (
                <div className="fixed bottom-4 left-4 z-[9999] pointer-events-none">
                    <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 border-2 border-amber-600 animate-pulse">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        DEMO MODE ACTIVE
                    </div>
                </div>
            )}
        </DemoContext.Provider>
    );
};

export const useDemoMode = () => {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoProvider');
    }
    return context;
};

// Stateless check for non-React files
export const isDemoModeActive = () => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('quoteit_demo_mode') === 'true';
};
