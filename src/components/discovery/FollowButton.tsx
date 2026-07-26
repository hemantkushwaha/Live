import React, { useState } from 'react';
import { UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  creatorId: string;
  isFollowing?: boolean;
  onFollow: (creatorId: string) => Promise<boolean>;
  onUnfollow: (creatorId: string) => Promise<boolean>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  creatorId,
  isFollowing = false,
  onFollow,
  onUnfollow,
  size = 'md',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow(creatorId);
      } else {
        await onFollow(creatorId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] gap-1 rounded-xl',
    md: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-2xl',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-2xl',
  }[size];

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isLoading}
        id={`unfollow-creator-btn-${creatorId}`}
        className={`font-bold transition-all border cursor-pointer inline-flex items-center justify-center ${
          isHovered
            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        } ${sizeClasses} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isHovered ? (
          <>
            <UserMinus className="w-3.5 h-3.5" />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            <span>Following</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      id={`follow-creator-btn-${creatorId}`}
      className={`font-bold transition-all cursor-pointer inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/30 ${sizeClasses} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};
