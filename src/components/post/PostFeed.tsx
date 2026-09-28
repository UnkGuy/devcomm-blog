'use client';

import React, { useState, useMemo } from 'react';
import { Search, Scroll } from 'lucide-react';
import type { PostWithDetails, Tag } from '@/types/database.types';
import { PostCard } from './PostCard';

interface PostFeedProps {
  initialPosts: PostWithDetails[];
  tags: Tag[];
  currentUserId?: string;
}

export function PostFeed({ initialPosts, tags, currentUserId }: PostFeedProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase()) ||
        post.profiles?.username?.toLowerCase().includes(search.toLowerCase());

      const matchesTag =
        !selectedTag ||
        post.post_tags?.some((pt) => pt.tags?.slug === selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [initialPosts, search, selectedTag]);

  return (
    <div className="space-y-6">
      {/* Dark Control Bar: Search + Tag Pills */}
      <div className="bg3-panel p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#c8aa6e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scrolls by title, lore, or scribe..."
            className="w-full pl-10 pr-4 py-2 bg-[#0b0908] border border-[#6e552f] text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
          />
        </div>

        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`font-display px-3 py-1.5 text-xs uppercase tracking-wider border cursor-pointer ${
                selectedTag === null
                  ? 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e]'
                  : 'bg-[#0b0908] text-[#9e8f77] border-[#4a3a24] hover:border-[#6e552f]'
              }`}
            >
              All Scrolls
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setSelectedTag(selectedTag === tag.slug ? null : tag.slug)
                }
                className={`font-display px-3 py-1.5 text-xs uppercase tracking-wider border cursor-pointer ${
                  selectedTag === tag.slug
                    ? 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e]'
                    : 'bg-[#0b0908] text-[#9e8f77] border-[#4a3a24] hover:border-[#6e552f]'
                }`}
              >
                {tag.name}
              </button>
            ))}
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
            Be the first adventurer to scribe a new scroll!
          </p>
        </div>
      )}
    </div>
  );
}