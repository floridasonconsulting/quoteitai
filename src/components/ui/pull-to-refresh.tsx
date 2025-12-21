import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    threshold?: number;
    maxPull?: number;
}

export function PullToRefresh({
    onRefresh,
    children,
    threshold = 80,
    maxPull = 120
}: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullY, setPullY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    const handlePan = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isRefreshing) return;

        // Only allow pull if we are at the top of the scroll
        if (containerRef.current && containerRef.current.scrollTop > 0) return;
        if (window.scrollY > 0) return;

        // Use a resistance curve
        const newY = Math.max(0, info.offset.y * 0.4); // 0.4 friction
        if (newY <= maxPull) {
            setPullY(newY);
        }
    };

    const handlePanEnd = async () => {
        if (isRefreshing) return;

        if (pullY > threshold) {
            setIsRefreshing(true);
            setPullY(threshold); // Snap to threshold

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullY(0);
            }
        } else {
            setPullY(0);
        }
    };

    useEffect(() => {
        controls.start({ y: pullY });
    }, [pullY, controls]);

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen touch-pan-y"
        >
            {/* Loading Indicator - Only show on desktop as it can feel "static" on mobile */}
            <div
                className="hidden md:flex absolute w-full justify-center items-center pointer-events-none z-10"
                style={{
                    top: -40, // Start hidden above
                    height: 40,
                    transform: `translateY(${Math.min(pullY, threshold)}px)`
                }}
            >
                <motion.div
                    animate={{ rotate: isRefreshing ? 360 : pullY * 2 }}
                    transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}
                    className={`rounded-full p-2 bg-background shadow-md border ${isRefreshing ? 'opacity-100' : 'opacity-75'}`}
                >
                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'text-primary' : 'text-muted-foreground'}`} />
                </motion.div>
            </div>

            {/* Content */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }} // Don't allow free drag
                dragElastic={0} // Handle elasticity manually
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                animate={controls}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ touchAction: 'pan-y' }} // Important for allowing vertical scroll when not pulling
            >
                {children}
            </motion.div>
        </div>
    );
}
