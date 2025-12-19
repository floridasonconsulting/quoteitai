import { motion } from "framer-motion";
import { ChevronDown, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProposalCoverProps {
  title: string;
  subtitle: string;
  clientName: string;
  coverImage?: string;
  companyLogo?: string;
  totalAmount?: number;
  currency?: string;
  onEnter: () => void;
  isOwner?: boolean;
  onEditImage?: (url?: string) => void;
}

/**
 * Stage 1: The Gate (Cover Page)
 * Full-screen landing page with high-impact visuals
 */
export function ProposalCover({
  title,
  subtitle,
  clientName,
  coverImage,
  companyLogo,
  totalAmount,
  currency = 'USD', // Default to USD
  onEnter,
  isOwner,
  onEditImage,
}: ProposalCoverProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundImage: coverImage
          ? (coverImage.startsWith('linear-gradient') || coverImage.startsWith('radial-gradient') || coverImage.startsWith('conic-gradient') || coverImage.startsWith('url')
            ? `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), ${coverImage}`
            : `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url(${coverImage})`)
          : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)', // Bold theme gradient fallback
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Owner Image Edit Action */}
      {isOwner && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditImage?.(coverImage)}
            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full font-bold uppercase tracking-wider text-[10px]"
          >
            <Edit3 className="w-3 h-3 mr-2" />
            Edit Hero Image
          </Button>
        </div>
      )}
      {/* Content Container */}
      <div className="text-center text-white px-4 max-w-4xl w-full">
        {/* Company Logo/Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="h-12 md:h-20 mx-auto mb-4 object-contain brightness-0 invert"
              onError={(e) => {
                console.error('[ProposalCover] Logo failed to load:', companyLogo);
                // Hide broken image
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <p className="text-sm uppercase tracking-widest text-white/80 mb-2 font-black">
              PROPOSAL FOR
            </p>
          )}
        </motion.div>

        {/* Project Title and Client info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight uppercase text-balance">
            {title}
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 pt-2">
            <div className="space-y-1">
              <p className="text-white/60 text-[10px] md:text-xs uppercase tracking-[0.3em] font-black">Prepared For</p>
              <p className="text-xl md:text-2xl font-black">{clientName}</p>
            </div>
          </div>
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
            className="group relative overflow-hidden bg-white text-gray-900 hover:bg-white/90 text-base md:text-lg px-8 md:px-12 py-6 md:py-8 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3 font-bold uppercase tracking-wider">
              Enter Proposal
              <ChevronDown className="w-5 h-5 md:w-6 md:h-6 animate-bounce" />
            </span>
          </Button>
        </motion.div>

        {/* Subtle Brand Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] md:text-xs text-white/40 tracking-widest uppercase">
            Powered by <span className="font-bold text-white/60">Quote.it AI</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ProposalCover;
