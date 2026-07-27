import React, { useEffect, useState } from 'react';
import { User as UserIcon, Mail, ShieldCheck, Edit3, Save, X, Radio, Heart, Users, Eye, Coins, Globe, Tag, ArrowLeft, Loader2, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { CreatorProfileFull, User } from '../../../shared/types';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfilePageProps {
  creatorId?: string;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ creatorId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const targetId = creatorId || user?.id;
  const isOwnProfile = !creatorId || creatorId === user?.id;

  const [profile, setProfile] = useState<CreatorProfileFull | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Form Fields
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [categoriesStr, setCategoriesStr] = useState<string>('');
  const [languagesStr, setLanguagesStr] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: 'avatars' | 'covers') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 10 MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await apiClient.post<any>('/media/upload', {
            base64Data,
            originalName: file.name,
            folder,
          });

          if (res.data && res.data.data) {
            const uploadedUrl = res.data.data.secureUrl || res.data.data.url;
            if (folder === 'avatars') {
              setAvatar(uploadedUrl);
            } else {
              setCoverImage(uploadedUrl);
            }
            setSuccessMsg(`${folder === 'avatars' ? 'Avatar' : 'Cover image'} uploaded to Object Storage successfully!`);
            setTimeout(() => setSuccessMsg(null), 3000);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to upload media');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Error processing media file');
      setIsUploading(false);
    }
  };

  const fetchProfile = async () => {
    if (!targetId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<any>(`/creator/${targetId}`);
      if (res.data && res.data.data) {
        const data: CreatorProfileFull = res.data.data;
        setProfile(data);
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
        setAvatar(data.avatar || '');
        setCoverImage(data.coverImage || '');
        setCountry(data.country || '');
        setCategoriesStr(data.categories ? data.categories.join(', ') : '');
        setLanguagesStr(data.languages ? data.languages.join(', ') : '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load creator profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const categories = categoriesStr.split(',').map((s) => s.trim()).filter(Boolean);
      const languages = languagesStr.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await apiClient.put<any>('/creator/profile', {
        displayName,
        bio,
        avatar,
        coverImage,
        country,
        categories,
        languages,
      });

      if (res.data && res.data.data) {
        setProfile((prev) => prev ? { ...prev, ...res.data.data } : null);
      }
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Loading Creator Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-in fade-in duration-300" id="profile-page">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isOwnProfile ? 'My Creator Profile' : `${profile?.displayName || 'Creator'} Profile`}
          </h1>
        </div>

        {isOwnProfile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            id="edit-profile-btn"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-6">
        {/* Banner Cover Image */}
        <div className="h-44 sm:h-52 w-full relative bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900">
          {profile?.coverImage && (
            <img
              src={profile.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        {/* Profile Info Overlay Row */}
        <div className="px-6 sm:px-8 pb-6 space-y-6 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-slate-900 bg-slate-950 overflow-hidden shadow-2xl shrink-0 flex items-center justify-center font-bold text-3xl text-indigo-400">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0).toUpperCase() || 'C'
                )}
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{profile?.displayName}</h2>
                  {profile?.isVerified && (
                    <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title="Verified Creator">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                  {profile?.isLive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 animate-pulse">
                      <Radio className="w-3 h-3" /> LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">@{profile?.username}</p>
              </div>
            </div>

            {onNavigate && isOwnProfile && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => onNavigate('/analytics')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Analytics
                </button>
              </div>
            )}
          </div>

          {/* Edit Mode vs View Mode */}
          {isEditing ? (
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Profile Details
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Avatar Image</label>
                    <label className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> Upload File
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'avatars')}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://... or upload image"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Cover Image</label>
                    <label className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> Upload File
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'covers')}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://... or upload image"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Categories (comma separated)</label>
                  <input
                    type="text"
                    value={categoriesStr}
                    onChange={(e) => setCategoriesStr(e.target.value)}
                    placeholder="Gaming, Music, IRL"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={languagesStr}
                    onChange={(e) => setLanguagesStr(e.target.value)}
                    placeholder="English, Spanish"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  id="save-profile-btn"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                {profile?.bio || 'No bio provided yet.'}
              </p>

              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
                {profile?.country && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{profile.country}</span>
                  </div>
                )}

                {profile?.categories && profile.categories.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{profile.categories.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Followers
              </div>
              <p className="text-lg font-bold font-mono text-white">{profile?.stats?.followersCount || 0}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Total Coins
              </div>
              <p className="text-lg font-bold font-mono text-amber-400">{profile?.stats?.totalEarnings || 0}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-rose-400" /> Streams
              </div>
              <p className="text-lg font-bold font-mono text-white">{profile?.stats?.totalStreams || 0}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> Views
              </div>
              <p className="text-lg font-bold font-mono text-white">{profile?.stats?.totalViewers || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
