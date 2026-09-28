'use client';

import React, { useState } from 'react';
import { signInAction, signUpAction } from '@/lib/actions/post.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoldDivider, WaxSeal } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result =
      mode === 'signin'
        ? await signInAction(formData)
        : await signUpAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-10">
      <div className="bg3-panel p-6 sm:p-8">
        <div className="text-center mb-6">
          <WaxSeal size={52} className="mb-2" />
          <h1 className="font-display text-2xl font-bold text-[#e8cf96]">
            {mode === 'signin' ? 'Enter the Archive' : 'Pledge Your Name'}
          </h1>
          <p className="text-sm text-[#9e8f77] mt-1">
            {mode === 'signin'
              ? 'Sign in to scribe scrolls and leave whispers.'
              : 'Create an adventurer profile to post on the noticeboard.'}
          </p>
          <GoldDivider />
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`font-display py-2 text-xs uppercase tracking-widest border cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e]'
                : 'bg-[#0b0908] text-[#8c7b65] border-[#4a3a24]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`font-display py-2 text-xs uppercase tracking-widest border cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e]'
                : 'bg-[#0b0908] text-[#8c7b65] border-[#4a3a24]'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              name="username"
              label="Adventurer Name (Username)"
              placeholder="e.g. GaleOfWaterdeep"
              required
            />
          )}

          <Input
            name="email"
            type="email"
            label="Email Address"
            placeholder="adventurer@ust.edu.ph"
            required
          />

          <Input
            name="password"
            type="password"
            label="Secret Passphrase (Password)"
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="gold" className="w-full mt-2" disabled={loading}>
            {loading
              ? 'Channeling...'
              : mode === 'signin'
              ? 'Unlock Archive'
              : 'Seal Registration'}
          </Button>
        </form>
      </div>

      <Toast message={error} type="error" onClose={() => setError(null)} />
    </div>
  );
}