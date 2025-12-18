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
          ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${coverImage})`
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', // Premium deep slate mesh-style gradient
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
          className="mb-12"
        >
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="h-16 md:h-24 mx-auto mb-4 object-contain brightness-0 invert"
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
          className="space-y-8"
        >
          <h1 className="text-5xl md:text-8xl font-black mb-4 leading-tight tracking-tight uppercase">
            {title}
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 pt-4">
            <div className="space-y-1">
              <p className="text-white/60 text-[10px] md:text-xs uppercase tracking-[0.3em] font-black">Prepared For</p>
              <p className="text-2xl md:text-3xl font-black">{clientName}</p>
            </div>

            {totalAmount !== undefined && (
              <div className="h-12 w-px bg-white/20 hidden md:block" />
            )}

            {totalAmount !== undefined && (
              <div className="space-y-1">
                <p className="text-white/60 text-[10px] md:text-xs uppercase tracking-[0.3em] font-black">Total Investment</p>
                <p className="text-3xl md:text-5xl font-black text-white">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-20"
        >
          <Button
            onClick={onEnter}
            size="lg"
            className="group relative overflow-hidden bg-white text-gray-900 hover:bg-white/90 text-lg px-12 py-8 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3 font-bold uppercase tracking-wider">
              Enter Proposal
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </span>
          </Button>
        </motion.div>

        {/* Subtle Brand Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-0 right-0 text-center"
        >
          <p className="text-xs text-white/40 tracking-widest uppercase">
            Powered by <span className="font-bold text-white/60">Quote.it AI</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ProposalCover;
