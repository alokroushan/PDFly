import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, color, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="tool-card group"
    >
      <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
      
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-current transition-all duration-300 group-hover:w-full opacity-20" />
    </motion.div>
  );
};
