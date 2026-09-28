'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Scroll, Tag as TagIcon, X, ChevronDown } from 'lucide-react';
import type { PostWithDetails, Tag } from '@/types/database.types';
import { PostCard } from './PostCard';

interface PostFeedProps {
  initialPosts: PostWithDetails[];
  tags: Tag[];
  currentUserId?: string;
}

export function PostFeed({ initialPosts, tags, currentUserId }: PostFeedProps) {
  const [search, setSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTagMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tags inside the tag search dropdown
  const matchingTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(query));
  }, [tags, tagSearch]);

  // Filter posts by search query + selected tag
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase()) ||
        post.profiles?.username?.toLowerCase().includes(search.toLowerCase());

      const matchesTag =
        !selectedTag ||
        post.post_tags?.some((pt) => pt.tags?.slug === selectedTag.slug);

      return matchesSearch && matchesTag;
    });
  }, [initialPosts, search, selectedTag]);

  return (
    <div className="space-y-6">
      {/* Scalable 2-Column Search & Tag Search Bar */}
      <div className="bg3-panel p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Left: Main Scroll Search (7 cols) */}
          <div className="relative md:col-span-7">
            <Search className="w-4 h-4 text-[#c8aa6e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scrolls by title, lore, or scribe..."
              className="w-full pl-10 pr-9 py-2 bg-[#0b0908] border border-[#6e552f] text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b65] hover:text-[#f3e5c8] cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Searchable Tag Combobox (5 cols) */}
          <div className="relative md:col-span-5" ref={dropdownRef}>
            <TagIcon className="w-4 h-4 text-[#c8aa6e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tagSearch}
              onFocus={() => setIsTagMenuOpen(true)}
              onChange={(e) => {
                setTagSearch(e.target.value);
                setIsTagMenuOpen(true);
              }}
              placeholder={
                selectedTag
                  ? `Tag: ${selectedTag.name.toUpperCase()} (search to change...)`
                  : `Search or filter by tag (${tags.length} available)...`
              }
              className="w-full pl-10 pr-9 py-2 bg-[#0b0908] border border-[#6e552f] text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
            />

            {selectedTag || tagSearch ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null);
                  setTagSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8aa6e] hover:text-[#f3e5c8] cursor-pointer"
                title="Clear tag filter"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsTagMenuOpen((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b65] hover:text-[#f3e5c8] cursor-pointer"
                title="Toggle tag list"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {/* Dropdown Menu of Matching Tags */}
            {isTagMenuOpen && (
              <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[#14100d] border border-[#c8aa6e] shadow-2xl z-30 divide-y divide-[#6e552f]/30">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag(null);
                    setTagSearch('');
                    setIsTagMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-display text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer ${
                    selectedTag === null
                      ? 'bg-[#2c2012] text-[#e8cf96]'
                      : 'text-[#b8a68e] hover:bg-[#1f1812]'
                  }`}
                >
                  <span>All Scrolls (No Tag Filter)</span>
                  <span className="text-[10px] text-[#8c7b65]">{initialPosts.length}</span>
                </button>

                {matchingTags.length > 0 ? (
                  matchingTags.map((tag) => {
                    const isSelected = selectedTag?.id === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag);
                          setTagSearch('');
                          setIsTagMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 font-display text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#2c2012] text-[#e8cf96]'
                            : 'text-[#d4c3a3] hover:bg-[#1f1812]'
                        }`}
                      >
                        <span>#{tag.name}</span>
                        {isSelected && (
                          <span className="text-[10px] text-[#c8aa6e]">Active</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3.5 py-3 text-xs text-[#8c7b65] italic">
                    No realm tags matching &ldquo;{tagSearch}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Pill Row (Only appears when filtering) */}
        {(selectedTag || search) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#6e552f]/40 text-xs text-[#b8a68e]">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Showing {filteredPosts.length} scroll(s)</span>
              {selectedTag && (
                <span className="font-display inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e] uppercase tracking-wider text-[11px]">
                  #{selectedTag.name}
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedTag(null);
                setTagSearch('');
              }}
              className="font-display uppercase tracking-wider text-[#c8aa6e] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Option A: 2-Column Tavern Noticeboard Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="bg3-panel p-12 text-center">
          <Scroll className="w-10 h-10 text-[#c8aa6e] mx-auto mb-3 opacity-75" />
          <h3 className="font-display text-lg text-[#e8cf96]">
            No Scrolls Found on the Noticeboard
          </h3>
          <p className="text-sm text-[#9e8f77] mt-1">
            Try clearing your search filter or scribe a new scroll!
          </p>
        </div>
      )}
    </div>
  );
}