'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Upload, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateProfileAction } from '@/lib/actions/post.actions';
import { DND_AVATAR_PRESETS } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ProfileModalProps {
  userId: string;
  initialUsername: string;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  role: 'user' | 'admin';
}

const MAX_USERNAME = 24;
const MAX_BIO = 160;

export function ProfileModal({
  userId,
  initialUsername,
  initialBio,
  initialAvatarUrl,
  role,
}: ProfileModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    initialAvatarUrl || DND_AVATAR_PRESETS[0].url
  );
  const [customUrlInput, setCustomUrlInput] = useState(
    initialAvatarUrl && !initialAvatarUrl.startsWith('data:image/svg')
      ? initialAvatarUrl
      : ''
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeAvatar = avatarUrl || DND_AVATAR_PRESETS[0].url;

  async function handleAvatarFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files (.jpg, .png, .webp, .gif) are permitted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be under 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const primaryPath = `${userId}/avatar-${Date.now()}.${ext}`;
    const fallbackPath = `avatars/${userId}-${Date.now()}.${ext}`;

    let finalPath = primaryPath;
    let { error: uploadError } = await supabase.storage
      .from('blog-media')
      .upload(primaryPath, file, { upsert: true });

    if (uploadError) {
      const retry = await supabase.storage
        .from('blog-media')
        .upload(fallbackPath, file, { upsert: true });
      uploadError = retry.error;
      finalPath = fallbackPath;
    }

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('blog-media').getPublicUrl(finalPath);

    setAvatarUrl(publicUrl);
    setCustomUrlInput(publicUrl);
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set('username', username);
    formData.set('bio', bio);
    formData.set('avatar_url', avatarUrl);

    const result = await updateProfileAction(formData);
    setSaving(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      {/* Navbar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 pl-2 pr-2.5 py-1 border border-[#6e552f]/80 bg-[#14100d] hover:border-[#c8aa6e] transition-colors cursor-pointer"
        title="Open Adventurer Dossier (Edit Profile & Avatar)"
      >
        <img
          src={activeAvatar}
          alt={initialUsername}
          className="w-7 h-7 rounded-full object-cover border border-[#c8aa6e]"
        />
        <span className="text-xs sm:text-sm text-[#e8dcc4] max-w-[110px] truncate font-medium">
          {initialUsername}
        </span>
        <span className="hidden md:inline font-display text-[10px] uppercase tracking-widest px-1.5 py-0.5 border border-[#6e552f] bg-[#1c1612] text-[#c8aa6e]">
          {role === 'admin' ? 'Archivist' : 'Adventurer'}
        </span>
      </button>

      {/* Portal Overlay Modal so Navbar backdrop-filter never clips it */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-xs flex justify-center p-4 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div className="bg3-panel w-full max-w-lg p-5 sm:p-7 space-y-5 my-auto relative">
              <div className="flex items-center justify-between border-b border-[#6e552f]/60 pb-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#e8cf96]">
                    Adventurer&apos;s Dossier
                  </h2>
                  <p className="text-xs text-[#9e8f77]">
                    Customize your guild crest, portrait, and title
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#9e8f77] hover:text-[#f3e5c8] cursor-pointer p-1"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Current Avatar Preview + Upload */}
                <div className="flex items-center gap-4 bg-[#0b0908] p-3.5 border border-[#6e552f]/60">
                  <img
                    src={activeAvatar}
                    alt="Selected Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#c8aa6e] shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <label className="font-display text-xs uppercase tracking-wider text-[#e8cf96] inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2c2012] border border-[#c8aa6e] hover:bg-[#3d2c19] cursor-pointer">
                      <Upload className="w-3.5 h-3.5"/>
                      <span>
                        {uploading ? 'Uploading...' : 'Upload Portrait Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-[#8c7b65]">
                      JPG, PNG, WebP or GIF (Max 5MB) — or choose a D&amp;D crest below
                    </p>
                  </div>
                </div>

                {/* Built-in D&D Class Presets (2 rows of 4 so names never wrap mid-word) */}
                <div className="space-y-1.5">
                  <label className="block font-display text-xs uppercase tracking-widest text-[#c8aa6e]">
                    D&amp;D Class Emblems
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DND_AVATAR_PRESETS.map((preset) => {
                      const selected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setCustomUrlInput('');
                          }}
                          className={`py-2 px-1.5 border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            selected
                              ? 'border-[#c8aa6e] bg-[#2c2012] scale-[1.02]'
                              : 'border-[#4a3a24] bg-[#0b0908] opacity-80 hover:opacity-100 hover:border-[#6e552f]'
                          }`}
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-9 h-9 rounded-full"
                          />
                          <span className="font-display text-[10px] uppercase text-[#d4c3a3] whitespace-nowrap">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Or Custom Avatar Image URL */}
                <div className="space-y-1">
                  <label className="block font-display text-xs uppercase tracking-widest text-[#c8aa6e]">
                    Or Paste Portrait Image URL
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      if (e.target.value.trim()) {
                        setAvatarUrl(e.target.value.trim());
                      }
                    }}
                    placeholder="[https://example.com/my-portrait.jpg](https://example.com/my-portrait.jpg)"
                    className="w-full px-3 py-1.5 bg-[#0b0908] border border-[#6e552f] text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
                  />
                </div>

                {/* Username with Character Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="font-display text-xs uppercase tracking-widest text-[#c8aa6e]">
                      Adventurer Name *
                    </label>
                    <span className="font-mono text-xs text-[#8c7b65]">
                      {username.length} / {MAX_USERNAME}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={MAX_USERNAME}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0b0908] border border-[#6e552f] text-sm text-[#f3e5c8] focus:outline-none focus:border-[#c8aa6e]"
                  />
                </div>

                {/* Bio with Character Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="font-display text-xs uppercase tracking-widest text-[#c8aa6e]">
                      Guild Bio / Motto
                    </label>
                    <span className="font-mono text-xs text-[#8c7b65]">
                      {bio.length} / {MAX_BIO}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={MAX_BIO}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Level 5 Divination Wizard • Collector of rare scrolls..."
                    className="w-full px-3 py-2 bg-[#0b0908] border border-[#6e552f] text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
                  />
                </div>

                {error && <p className="text-xs text-[#f87171]">{error}</p>}

                <div className="flex justify-end gap-2 pt-2 border-t border-[#6e552f]/40">
                  <Button
                    onClick={() => setIsOpen(false)}
                    size="sm"
                    type="button"
                    variant="obsidian"
                  >
                    Cancel
                  </Button>
                  <Button disabled={saving} size="sm" type="submit" variant="gold">
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Dossier'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}