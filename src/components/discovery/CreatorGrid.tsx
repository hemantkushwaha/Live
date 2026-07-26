import React from 'react';
import { CreatorProfileFull } from '../../../shared/types';
import { CreatorCard } from './CreatorCard';
import { Users } from 'lucide-react';

interface CreatorGridProps {
  creators: CreatorProfileFull[];
  onSelectCreator: (creator: CreatorProfileFull) => void;
  onFollow: (creatorId: string) => Promise<boolean>;
  onUnfollow: (creatorId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const CreatorGrid: React.FC<CreatorGridProps> = ({
  creators,
  onSelectCreator,
  onFollow,
  onUnfollow,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="h-72 rounded-3xl bg-slate-900/60 border border-slate-800" />
        ))}
      </div>
    );
  }

  if (!creators || creators.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <Users className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No Creators Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No creators matched your search or category filters. Try resetting search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="creator-grid">
      {creators.map((creator) => (
        <CreatorCard
          key={creator.id}
          creator={creator}
          onSelect={onSelectCreator}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
        />
      ))}
    </div>
  );
};
