import { GoldDivider } from '@/components/ui/Badge';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[#6e552f]/60 bg-[#0b0908] py-8 text-center">
      <div className="max-w-5xl mx-auto px-4">
        <GoldDivider className="my-1" />
        <p className="font-display text-xs uppercase tracking-widest text-[#c8aa6e] mb-4">
          Viggy&apos;s Archive &bull; Development Committee Assessment
        </p>
        
        <div className="flex items-center justify-center gap-6 text-[13px] font-display uppercase tracking-widest text-[#9e8f77]">
          <Link href="/about" className="hover:text-[#f3e5c8] transition-colors">
            About Us
          </Link>
          <span className="text-[#6e552f]">&bull;</span>
          <Link href="/issues" className="hover:text-[#f3e5c8] transition-colors">
            Report Issue
          </Link>
        </div>
      </div>
    </footer>
  );
}