'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parseMediaUrl } from '@/lib/utils';

interface MediaAttachmentInputProps {
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function MediaAttachmentInput({
  value,
  onChange,
  onError,
  onUploadingChange,
}: MediaAttachmentInputProps) {
  const [uploading, setUploading] = useState(false);
  const parsed = parseMediaUrl(value);

  function setUploadState(state: boolean) {
    setUploading(state);
    onUploadingChange?.(state);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Only image files (.jpg, .png, .webp, .gif) are permitted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('Image must be under the 10MB storage limit.');
      return;
    }

    setUploadState(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      onError('You must be signed in to upload images.');
      setUploadState(false);
      return;
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const primaryPath = `${user.id}/cover-${Date.now()}.${ext}`;
    const fallbackPath = `posts/${user.id}-${Date.now()}.${ext}`;

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
      onError(`Upload failed: ${uploadError.message}`);
      setUploadState(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('blog-media').getPublicUrl(finalPath);

    onChange(publicUrl);
    setUploadState(false);
    e.target.value = '';
  }

  return (
    <div className="space-y-2 bg-[#0b0908]/90 p-3.5 border border-[#6e552f]/70">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
          Featured Cover Art (Optional)
        </label>

        {parsed.type !== 'none' && (
          <span className="font-display text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e] inline-flex items-center gap-1">
            {parsed.type === 'image' && (
              <>
                <ImageIcon className="w-3 h-3" />
                <span>Illustration Attached</span>
              </>
            )}
            {parsed.type === 'link' && (
              <>
                <ExternalLink className="w-3 h-3" />
                <span>Web Link Attached</span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <label className="font-display text-xs uppercase tracking-wider text-[#e8cf96] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#2c2012] border border-[#c8aa6e] hover:bg-[#3d2c19] cursor-pointer shrink-0 transition-colors">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? 'Uploading...' : 'Upload Cover Image'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <div className="relative flex-1 flex">
          {value ? (
            <div className="w-full pl-3 pr-3 py-2 bg-[#14100d] border border-[#6e552f] flex items-center justify-between">
              <span className="text-sm text-[#86efac] flex items-center gap-1.5 font-medium truncate">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Cover Successfully Attached</span>
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[#fca5a5] hover:text-white cursor-pointer ml-2 shrink-0"
                title="Remove attached media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <input
              name="cover_image_url"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste an Image URL for the cover..."
              className="w-full pl-3 pr-3 py-2 bg-[#14100d] border border-[#6e552f] text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
            />
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#8c7b65]">
        Upload a file (max 10MB) or paste a link. If blank, the archive uses the first image in your lore text.
      </p>
    </div>
  );
}