import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProposalCoverProps {
  coverImage?: string;
  companyName: string;
  projectTitle: string;
  clientName: string;
  onEnter: () => void;
}

/**
 * Stage 1: The Gate (Cover Page)
 * Full-screen landing page with high-impact visuals
 */
export function ProposalCover({
  coverImage,
  companyName,
  projectTitle,
  clientName,
  onEnter,
}: ProposalCoverProps) {
  const defaultCoverImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundImage: coverImage
          ? `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${coverImage})`
          : 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)', // Vibrant modern gradient fallback
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Content Container */}
      <div className="text-center text-white px-4 max-w-4xl">
        {/* Company Logo/Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <p className="text-sm uppercase tracking-widest text-white/80 mb-2">
            Proposal from
          </p>
          <h3 className="text-2xl font-semibold">{companyName}</h3>
        </motion.div>

        {/* Project Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
            {projectTitle}
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Prepared for {clientName}
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12"
        >
          <Button
            onClick={onEnter}
            size="lg"
            className="group relative overflow-hidden bg-white text-gray-900 hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-2xl"
          >
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-2"
            >
              View Proposal
              <ChevronDown className="w-5 h-5" />
            </motion.span>
          </Button>
        </motion.div>

        {/* Subtle Brand Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-0 right-0 text-center"
        >
          <p className="text-xs text-white/60">
            Powered by <span className="font-semibold">Quote.it AI</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}