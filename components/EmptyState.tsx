import React, { ReactNode } from 'react';
import { Inbox, Search, FileQuestion, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return <Search className="w-16 h-16 text-secondary-light" />;
      case 'error':
        return <FileQuestion className="w-16 h-16 text-secondary-light" />;
      default:
        return <Inbox className="w-16 h-16 text-secondary-light" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 opacity-60">{icon || getDefaultIcon()}</div>
      <h3 className="text-xl font-semibold text-primary-light mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-secondary-light max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const EmptyThreads: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={<Sparkles className="w-16 h-16 text-purple-500" />}
    title="No conversations yet"
    description="Start a new thread to chat with Sylvia and explore your workspace."
    action={{
      label: 'Start New Thread',
      onClick: onCreate,
    }}
  />
);

export const EmptySearch: React.FC = () => (
  <EmptyState
    variant="search"
    title="No results found"
    description="Try adjusting your search query or filters to find what you're looking for."
  />
);

export const EmptyList: React.FC<{ entityType: string; onCreate?: () => void }> = ({
  entityType,
  onCreate,
}) => (
  <EmptyState
    title={`No ${entityType} yet`}
    description={`Get started by creating your first ${entityType}.`}
    action={
      onCreate
        ? {
            label: `Create ${entityType}`,
            onClick: onCreate,
          }
        : undefined
    }
  />
);

export default EmptyState;
