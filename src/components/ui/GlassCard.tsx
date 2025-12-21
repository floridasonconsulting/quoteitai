import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export const GlassCard = ({ children, className = "", delay = 0 }: GlassCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{
            scale: 1.02,
            boxShadow: "0px 0px 25px hsl(var(--primary)/0.2)",
            borderColor: "hsl(var(--primary)/0.4)"
        }}
        className={`bg-card/30 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-xl transition-all duration-300 ${className}`}
    >
        {children}
    </motion.div>
);
