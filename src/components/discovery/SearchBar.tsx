import React from 'react';
import { Search, X, Filter, MapPin, Tag } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  categoriesList: string[];
  countriesList?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCountry,
  onCountryChange,
  categoriesList,
  countriesList = ['United States', 'Canada', 'United Kingdom', 'Japan', 'Australia', 'Germany', 'Global'],
}) => {
  return (
    <div className="space-y-3" id="creator-search-bar">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by username, display name, bio, or tags..."
            id="search-creators-input"
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Category Dropdown */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300">
            <Tag className="w-3.5 h-3.5 text-indigo-400 mr-2 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              id="category-filter-select"
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Country Dropdown */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              id="country-filter-select"
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Countries</option>
              {countriesList.map((cnt) => (
                <option key={cnt} value={cnt} className="bg-slate-900 text-white">
                  {cnt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
