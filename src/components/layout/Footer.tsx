import { GoldDivider } from '@/components/ui/Badge';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[#6e552f]/60 bg-[#0b0908] py-8 text-center">
      <div className="max-w-5xl mx-auto px-4">
        <GoldDivider className="my-1" />
        <p className="font-display text-xs uppercase tracking-widest text-[#c8aa6e]">
          The Chronicler&apos;s Archive &bull; Development Committee Assessment
        </p>
      </div>
    </footer>
  );
}