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
            boxShadow: "0px 0px 25px rgba(0, 255, 255, 0.2)",
            borderColor: "rgba(0, 255, 255, 0.4)"
        }}
        className={`bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl transition-all duration-300 ${className}`}
    >
        {children}
    </motion.div>
);
