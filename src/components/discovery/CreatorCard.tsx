import React from 'react';
import { CreatorProfileFull } from '../../../shared/types';
import { FollowButton } from './FollowButton';
import { Radio, Users, CheckCircle, MapPin, Eye } from 'lucide-react';

interface CreatorCardProps {
  creator: CreatorProfileFull;
  onSelect: (creator: CreatorProfileFull) => void;
  onFollow: (creatorId: string) => Promise<boolean>;
  onUnfollow: (creatorId: string) => Promise<boolean>;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  onSelect,
  onFollow,
  onUnfollow,
}) => {
  return (
    <div
      onClick={() => onSelect(creator)}
      id={`creator-card-${creator.id}`}
      className="group relative rounded-3xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Cover Image Header */}
      <div className="relative h-28 w-full bg-slate-950 overflow-hidden">
        <img
          src={creator.coverImage}
          alt={`${creator.displayName} cover`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {creator.isLive ? (
            <div className="px-2.5 py-1 rounded-full bg-rose-600/90 border border-rose-400/40 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md animate-pulse">
              <Radio className="w-3 h-3 text-white" />
              <span>LIVE</span>
            </div>
          ) : creator.isOnline ? (
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/80 border border-emerald-400/40 text-white text-[10px] font-bold flex items-center gap-1 shadow-md backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Online</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-slate-400 text-[10px] font-medium backdrop-blur-md">
              Offline
            </div>
          )}

          {creator.country && (
            <div className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-800/80 text-slate-300 text-[10px] font-medium flex items-center gap-1 backdrop-blur-md">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[80px]">{creator.country}</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info Content Body */}
      <div className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
        {/* Avatar & Display Name Header */}
        <div className="flex items-end justify-between -mt-10 relative z-10">
          <div className="relative">
            <img
              src={creator.avatar}
              alt={creator.displayName}
              className="w-16 h-16 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800"
              referrerPolicy="no-referrer"
            />
            {creator.isOnline && (
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            )}
          </div>

          <FollowButton
            creatorId={creator.id}
            isFollowing={creator.isFollowing}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            size="sm"
          />
        </div>

        {/* Names & Bio */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-white text-base truncate group-hover:text-indigo-300 transition-colors">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" title="Verified Creator" />
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono">@{creator.username}</p>
          <p className="text-xs text-slate-300 line-clamp-2 pt-1 font-sans leading-relaxed">
            {creator.bio}
          </p>
        </div>

        {/* Categories Tags */}
        {creator.categories && creator.categories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {creator.categories.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Stats Row Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1 text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold font-mono text-white">
              {creator.stats.followersCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">followers</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{creator.stats.totalStreams} streams</span>
          </div>
        </div>
      </div>
    </div>
  );
};
