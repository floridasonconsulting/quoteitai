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
        const updateTheme = async () => {
            if (!navigator.geolocation) {
                setTheme('system');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(
                            `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
                        );
                        const data = await response.json();

                        const now = new Date();
                        const sunrise = new Date(data.results.sunrise);
                        const sunset = new Date(data.results.sunset);

                        // If current time is between sunrise and sunset, use light mode. Otherwise dark.
                        if (now > sunrise && now < sunset) {
                            setTheme('light');
                        } else {
                            setTheme('dark');
                        }
                    } catch (error) {
                        console.error('Solar theme fetch failed:', error);
                        setTheme('system');
                    }
                },
                (error) => {
                    console.error('Geolocation failed:', error);
                    setTheme('system');
                }
            );
        };

        updateTheme();

        // Re-check every hour to handle transitions
        const interval = setInterval(updateTheme, 3600000);
        return () => clearInterval(interval);
    }, [setTheme]);
};
