'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import { updateProfileAction } from '@/lib/actions/post.actions';

interface InlineBioEditorProps {
  initialBio: string | null;
  username: string;
  avatarUrl: string | null;
  isOwnProfile: boolean;
}

export function InlineBioEditor({
  initialBio,
  username,
  avatarUrl,
  isOwnProfile,
}: InlineBioEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwnProfile) {
    return (
      <p className="text-sm sm:text-base text-[#d4c3a3] italic max-w-2xl leading-relaxed">
        &ldquo;
        {initialBio ||
          'A wandering scribe of the Chronicler’s Archive, yet to inscribe a personal motto.'}
        &rdquo;
      </p>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set('username', username);
    formData.set('avatar_url', avatarUrl || '');
    formData.set('bio', bio);

    const result = await updateProfileAction(formData);
    setSaving(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  if (isEditing) {
    return (
      <div className="space-y-2 mt-2 max-w-2xl">
        <textarea
          rows={3}
          maxLength={160}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Inscribe your guild bio or motto (max 160 characters)..."
          className="w-full p-2.5 bg-[#0b0908] border border-[#c8aa6e] text-sm text-[#f3e5c8] focus:outline-none placeholder:text-[#786852]"
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#8c7b65]">
            {bio.length} / 160
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBio(initialBio || '');
                setIsEditing(false);
              }}
              className="px-2.5 py-1 text-xs text-[#9e8f77] hover:text-[#f3e5c8] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-wood-plaque px-3 py-1 text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{saving ? 'Sealing...' : 'Save Motto'}</span>
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-[#f87171]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 max-w-2xl">
      <p className="text-sm sm:text-base text-[#d4c3a3] italic leading-relaxed">
        &ldquo;
        {initialBio ||
          'A wandering scribe of the Chronicler’s Archive, yet to inscribe a personal motto.'}
        &rdquo;
      </p>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="opacity-60 group-hover:opacity-100 text-[#c8aa6e] hover:text-[#f3e5c8] p-1 transition-opacity cursor-pointer shrink-0"
        title="Edit Guild Motto"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}