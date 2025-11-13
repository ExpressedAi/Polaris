import React, { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  icon?: ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const FAB: React.FC<FABProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <button
      onClick={onClick}
      className={`fab ${positionClasses[position]}`}
      aria-label={label || 'Quick action'}
      title={label}
    >
      {icon || <Plus className="w-6 h-6" />}
    </button>
  );
};

export default FAB;
