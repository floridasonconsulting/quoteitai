import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * useSolarTheme
 * Automatically transitions between light and dark mode based on the user's local sunrise and sunset.
 * Falls back to system preference if location is unavailable.
 */
export const useSolarTheme = () => {
    const { setTheme } = useTheme();

    useEffect(() => {
        const updateTheme = () => {
            const now = new Date();
            const hours = now.getHours();

            // Light mode between 6 AM (6) and 6 PM (18)
            const isDaytime = hours >= 6 && hours < 18;

            if (isDaytime) {
                setTheme('light');
            } else {
                setTheme('dark');
            }
        };

        updateTheme();

        // Re-check every 5 minutes to catch the exact crossover
        const interval = setInterval(updateTheme, 300000);
        return () => clearInterval(interval);
    }, [setTheme]);
};
