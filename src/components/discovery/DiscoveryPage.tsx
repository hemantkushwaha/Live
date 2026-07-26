import React from 'react';
import { useCreatorDiscovery } from '../../hooks/useCreatorDiscovery';
import { SearchBar } from './SearchBar';
import { CreatorGrid } from './CreatorGrid';
import { CreatorProfileModal } from './CreatorProfileModal';
import { StreamRoom } from '../../../shared/types';
import {
  Compass,
  TrendingUp,
  Radio,
  Clock,
  Sparkles,
  Users,
  RefreshCw,
  ArrowLeft,
  Flame,
} from 'lucide-react';

interface DiscoveryPageProps {
  onBack?: () => void;
  onWatchStream?: (stream: StreamRoom) => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onBack, onWatchStream }) => {
  const {
    discoveryData,
    creators,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCountry,
    setSelectedCountry,
    selectedSection,
    setSelectedSection,
    selectedCreator,
    setSelectedCreator,
    followCreator,
    unfollowCreator,
    refetch,
  } = useCreatorDiscovery();

  const handleSelectCreator = (creator: any) => {
    setSelectedCreator(creator);
  };

  const handleWatchStreamFromModal = (streamId: string) => {
    if (onWatchStream && selectedCreator && selectedCreator.isLive) {
      onWatchStream({
        id: streamId,
        streamerId: selectedCreator.id,
        streamerName: selectedCreator.displayName,
        streamerEmail: `${selectedCreator.username}@example.com`,
        title: `${selectedCreator.displayName}'s Live Stream`,
        viewers: [],
        isPausedForPrivate: false,
        createdAt: Date.now(),
      });
    }
  };

  const categories = discoveryData?.categories || [
    'Music',
    'Gaming',
    'Technology',
    'Fitness',
    'Art & Design',
    'Entertainment',
    'Education',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="creator-discovery-page">
      {/* Top Bar Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shrink-0">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Creator Discovery</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                Explore & Follow
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Browse top creators, watch live streams, inspect statistics, and follow your favorites
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Refresh Discovery"
            id="refresh-discovery-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              id="discovery-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lobby</span>
            </button>
          )}
        </div>
      </div>

      {/* Discovery Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-semibold text-xs border-b border-slate-800/80">
        <button
          onClick={() => setSelectedSection('all')}
          id="tab-section-all"
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            selectedSection === 'all'
              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Creators ({discoveryData?.totalCreators || creators.length})</span>
        </button>

        <button
          onClick={() => setSelectedSection('trending')}
          id="tab-section-trending"
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            selectedSection === 'trending'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-400/40'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Trending ({discoveryData?.trending?.length || 0})</span>
        </button>

        <button
          onClick={() => setSelectedSection('online')}
          id="tab-section-online"
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            selectedSection === 'online'
              ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Online ({discoveryData?.online?.length || 0})</span>
        </button>

        <button
          onClick={() => setSelectedSection('recently_live')}
          id="tab-section-recently-live"
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            selectedSection === 'recently_live'
              ? 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/20 border border-rose-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-400" />
          <span>Recently Live ({discoveryData?.recentlyLive?.length || 0})</span>
        </button>

        <button
          onClick={() => setSelectedSection('newest')}
          id="tab-section-newest"
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
            selectedSection === 'newest'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/20 border border-purple-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Newest ({discoveryData?.newest?.length || 0})</span>
        </button>
      </div>

      {/* Search & Filtering Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        categoriesList={categories}
      />

      {/* Category Pills Quick Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All Tags
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Creator Grid */}
      <CreatorGrid
        creators={creators}
        onSelectCreator={handleSelectCreator}
        onFollow={followCreator}
        onUnfollow={unfollowCreator}
        isLoading={isLoading}
      />

      {/* Creator Profile Modal */}
      <CreatorProfileModal
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
        onFollow={followCreator}
        onUnfollow={unfollowCreator}
        onWatchStream={handleWatchStreamFromModal}
      />
    </div>
  );
};
