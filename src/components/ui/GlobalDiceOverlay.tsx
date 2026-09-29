'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DiceRollEventDetail {
  type: 'inspiration' | 'skill';
  result: number;
  label?: string;
}

export function GlobalDiceOverlay() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    setMounted(true);

    const handleRoll = (e: Event) => {
      const customEvent = e as CustomEvent<DiceRollEventDetail>;
      const { result: finalResult, label: rollLabel, type } = customEvent.detail;

      setLabel(rollLabel || (type === 'inspiration' ? 'Inspiration Roll' : 'Skill Check'));
      setResult(null);
      setActive(true);
      setIsRolling(true);

      // Let the spin animation play for 800ms before locking the result
      setTimeout(() => {
        setIsRolling(false);
        setResult(finalResult);

        // Keep it on screen for 1.8 seconds after revealing, then hide
        setTimeout(() => {
          setActive(false);
        }, 1800);
      }, 800);
    };

    window.addEventListener('trigger-dice-roll', handleRoll);
    return () => window.removeEventListener('trigger-dice-roll', handleRoll);
  }, []);

  if (!mounted || !active) return null;

  const isNat20 = result === 20;
  const isNat1 = result === 1;

  let containerClass = 'text-[#c8aa6e]';
  let animationClass = isRolling ? 'animate-dice-roll' : '';

  if (!isRolling && result !== null) {
    if (isNat20) {
      containerClass = 'text-[#fde68a]';
      animationClass = 'animate-nat20';
    } else if (isNat1) {
      containerClass = 'text-[#fca5a5]';
      animationClass = 'animate-nat1';
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
      
      {/* Title / Label */}
      <div className={`mb-8 font-display text-xl sm:text-2xl uppercase tracking-[0.2em] font-bold text-center drop-shadow-lg transition-opacity duration-300 ${isRolling ? 'opacity-0' : 'opacity-100'} ${isNat20 ? 'text-[#fde68a]' : isNat1 ? 'text-[#fca5a5]' : 'text-[#e8cf96]'}`}>
        {label}
      </div>

      {/* The D20 SVG */}
      <div className={`relative w-40 h-40 sm:w-48 sm:h-48 ${animationClass}`}>
        <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${containerClass}`}>
          {/* Main Hexagon outline */}
          <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="#14100d" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
          {/* Inner center triangle */}
          <polygon points="50,25 25,65 75,65" fill="#1c1612" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Connecting 3D perspective lines */}
          <polyline points="50,5 50,25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <polyline points="10,25 50,25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <polyline points="90,25 50,25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <polyline points="10,75 25,65" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <polyline points="90,75 75,65" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <polyline points="50,95 25,65" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <polyline points="50,95 75,65" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>

        {/* The Result Number */}
        {!isRolling && result !== null && (
          <div className="absolute inset-0 flex items-center justify-center mt-2">
            <span className={`font-display text-4xl sm:text-5xl font-bold ${containerClass}`}>
              {result}
            </span>
          </div>
        )}
      </div>

      {/* Fluff text below dice */}
      {!isRolling && result !== null && (
        <div className={`mt-8 font-display text-lg uppercase tracking-widest font-bold drop-shadow-md transition-opacity duration-300 ${isNat20 ? 'text-[#fde68a]' : isNat1 ? 'text-[#fca5a5]' : 'text-transparent'}`}>
          {isNat20 ? 'Critical Success!' : isNat1 ? 'Critical Failure' : ' '}
        </div>
      )}

    </div>,
    document.body
  );
}