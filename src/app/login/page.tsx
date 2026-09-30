'use client';

import React, { useState } from 'react';
import { signInAction, signUpAction } from '@/lib/actions/post.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoldDivider, WaxSeal } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { getParchmentClass } from '@/lib/utils';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deterministically choose a parchment texture for the inner contract
  const parchmentStyle = getParchmentClass(mode);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    // Efficient client-side validation catches mistakes before network requests
    if (mode === 'signup') {
      const confirmPassword = formData.get('confirmPassword') as string;
      if (password !== confirmPassword) {
        setError("Your secret passphrases do not match. Please try again.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Your passphrase must be at least 6 characters long.");
        setLoading(false);
        return;
      }
    }

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
    <div className="max-w-md mx-auto my-10 shadow-2xl">
      {/* 1. Restored the original dark obsidian background panel */}
      <div className="bg3-panel p-6 sm:p-8">
        
        <div className="text-center mb-6">
          <WaxSeal seed={mode} size={52} className="mb-2 mx-auto" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#e8cf96]">
            {mode === 'signin' ? 'Enter the Archive' : 'Pledge Your Name'}
          </h1>
          <p className="text-sm text-[#9e8f77] mt-1 font-semibold">
            {mode === 'signin'
              ? 'Sign in to scribe scrolls and leave whispers.'
              : 'Create an adventurer profile to post on the noticeboard.'}
          </p>
          {/* Restored the standard gold divider */}
          <GoldDivider /> 
        </div>

        {/* Mode Switch Tabs (Restored to dark theme) */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`font-display py-2 text-xs uppercase tracking-widest border transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e]'
                : 'bg-[#0b0908] text-[#8c7b65] border-[#4a3a24] hover:bg-[#14100d]'
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
            className={`font-display py-2 text-xs uppercase tracking-widest border transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e]'
                : 'bg-[#0b0908] text-[#8c7b65] border-[#4a3a24] hover:bg-[#14100d]'
            }`}
          >
            Register
          </button>
        </div>

        {/* 2. Pinned Parchment Contract layered over the Obsidian Panel */}
        <div className={`${parchmentStyle} p-5 sm:p-7 relative shadow-[0_4px_12px_rgba(0,0,0,0.6)]`}>
          
          {/* Decorative iron nail corner pins to sell the physical UI effect */}
          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-[#14100d] rounded-full border border-[#3d2817] shadow-sm"></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#14100d] rounded-full border border-[#3d2817] shadow-sm"></div>
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#14100d] rounded-full border border-[#3d2817] shadow-sm"></div>
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#14100d] rounded-full border border-[#3d2817] shadow-sm"></div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {mode === 'signup' && (
              <Input
                name="username"
                variant="parchment"
                label="Adventurer Name (Username)"
                placeholder="e.g. Quack the Quacker"
                required
              />
            )}

            <Input
              name="email"
              type="email"
              variant="parchment"
              label="Email Address"
              placeholder="adventurer@email.com"
              required
            />

            <Input
              name="password"
              type="password"
              variant="parchment"
              label="Secret Passphrase (Password)"
              placeholder="••••••••"
              required
            />
            
            {mode === 'signup' && (
              <Input
                name="confirmPassword"
                type="password"
                variant="parchment"
                label="Confirm Passphrase"
                placeholder="••••••••"
                required
              />
            )}

            <div className="pt-3">
              <Button type="submit" variant="gold" className="w-full py-2.5" disabled={loading}>
                {loading
                  ? 'Channeling...'
                  : mode === 'signin'
                  ? 'Unlock Archive'
                  : 'Seal Registration'}
              </Button>
            </div>
          </form>
        </div>

      </div>

      <Toast message={error} type="error" onClose={() => setError(null)} />
    </div>
  );
}