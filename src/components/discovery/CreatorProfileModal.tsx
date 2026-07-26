import React from 'react';
import { CreatorProfileFull } from '../../../shared/types';
import { FollowButton } from './FollowButton';
import {
  X,
  CheckCircle,
  Radio,
  MapPin,
  Globe,
  Users,
  Eye,
  Heart,
  Gift,
  Coins,
  TrendingUp,
  Video,
} from 'lucide-react';

interface CreatorProfileModalProps {
  creator: CreatorProfileFull | null;
  onClose: () => void;
  onFollow: (creatorId: string) => Promise<boolean>;
  onUnfollow: (creatorId: string) => Promise<boolean>;
  onWatchStream?: (streamId: string) => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  creator,
  onClose,
  onFollow,
  onUnfollow,
  onWatchStream,
}) => {
  if (!creator) return null;

  const stats = creator.stats || {
    followersCount: 0,
    followingCount: 0,
    totalStreams: 0,
    totalViewers: 0,
    totalLikes: 0,
    totalGifts: 0,
    totalTips: 0,
    totalEarnings: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" id="creator-profile-modal">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          id="close-creator-profile-modal-btn"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-950 border border-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Cover Image */}
        <div className="relative h-40 sm:h-48 w-full bg-slate-950 shrink-0">
          <img
            src={creator.coverImage}
            alt={`${creator.displayName} cover`}
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* Live Status Badge */}
          {creator.isLive && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-rose-600 border border-rose-400/40 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl animate-pulse">
              <Radio className="w-4 h-4 text-white" />
              <span>LIVE NOW</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-0 space-y-6 overflow-y-auto flex-1">
          {/* Avatar + Main Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 relative z-10">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                <img
                  src={creator.avatar}
                  alt={creator.displayName}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-900 shadow-2xl bg-slate-800"
                  referrerPolicy="no-referrer"
                />
                {creator.isOnline && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                )}
              </div>

              <div className="space-y-0.5 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {creator.displayName}
                  </h2>
                  {creator.isVerified && (
                    <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" title="Verified Creator" />
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">@{creator.username}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {creator.isLive && creator.liveStreamId && onWatchStream && (
                <button
                  onClick={() => {
                    onClose();
                    onWatchStream(creator.liveStreamId!);
                  }}
                  id="watch-creator-live-stream-btn"
                  className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Watch Stream</span>
                </button>
              )}

              <FollowButton
                creatorId={creator.id}
                isFollowing={creator.isFollowing}
                onFollow={onFollow}
                onUnfollow={onUnfollow}
                size="lg"
              />
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-slate-300 font-sans leading-relaxed">{creator.bio}</p>

          {/* Metadata Badges: Country, Languages, Categories */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {creator.country && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{creator.country}</span>
              </div>
            )}

            {creator.languages && creator.languages.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>{creator.languages.join(', ')}</span>
              </div>
            )}

            {creator.categories && creator.categories.map((cat, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Comprehensive Creator Statistics Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Creator Statistics</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Followers */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Followers</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.followersCount.toLocaleString()}
                </p>
              </div>

              {/* Following */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Following</span>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.followingCount.toLocaleString()}
                </p>
              </div>

              {/* Total Streams */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Total Streams</span>
                  <Radio className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.totalStreams.toLocaleString()}
                </p>
              </div>

              {/* Total Viewers */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Total Viewers</span>
                  <Eye className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.totalViewers.toLocaleString()}
                </p>
              </div>

              {/* Likes */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Total Likes</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.totalLikes.toLocaleString()}
                </p>
              </div>

              {/* Gifts */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Gifts Received</span>
                  <Gift className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.totalGifts.toLocaleString()}
                </p>
              </div>

              {/* Tips */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Tips Received</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {stats.totalTips.toLocaleString()}
                </p>
              </div>

              {/* Earnings */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-[11px] font-bold">Total Earnings</span>
                  <Coins className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-lg font-black text-emerald-400 font-mono">
                  {stats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
