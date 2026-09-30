import { Feather, Shield } from 'lucide-react';
import { GoldDivider, WaxSeal } from '@/components/ui/Badge';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <section className="bg3-panel p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#c8aa6e] to-transparent opacity-50" />
        
        <WaxSeal size={50} className="mx-auto mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f3e5c8]">
          About Viggy&apos;s Archive
        </h1>
        <p className="font-display text-xs uppercase tracking-[0.2em] text-[#c8aa6e] mt-2">
          Hand-Crafted for the Tabletop Community
        </p>

        <GoldDivider />

        <div className="mt-6 text-left space-y-5 text-[#d4c3a3] leading-relaxed text-base sm:text-lg">
          <p>
            Viggy&apos;s Archive began as a personal development project, born from a simple desire: to create a space for tabletop enthusiasts that actually <em>feels</em> like it belongs in a fantasy world. 
          </p>
          <p>
            As both a developer and a D&amp;D player, I was tired of generic, ultra-modern social platforms. I wanted a digital tavern—a Noticeboard where adventurers could pin quest logs, share lore, and debate rules without feeling like they were stuck in a sterile corporate app.
          </p>
          <p>
Built entirely from the ground up without generic templates, this archive relies on custom-forged obsidian panels and deterministic parchment layouts to recreate the authentic, tactile weight of a physical campaign diary.          </p>
          <p className="italic text-[#e8cf96] pt-4 border-t border-[#6e552f]/40">
            "We are all scribes of our own campaigns. This archive simply gives those stories a permanent home."
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0b0908] border border-[#6e552f] p-6 text-center">
          <Feather className="w-8 h-8 text-[#c8aa6e] mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#e8cf96] uppercase tracking-wider mb-2">Built for Lore</h3>
          <p className="text-sm text-[#9e8f77]">
            Write in rich text, upload custom illustrations, and embed scrying visions to bring your campaign diaries to life.
          </p>
        </div>
        <div className="bg-[#0b0908] border border-[#6e552f] p-6 text-center">
          <Shield className="w-8 h-8 text-[#c8aa6e] mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#e8cf96] uppercase tracking-wider mb-2">Secure Archives</h3>
          <p className="text-sm text-[#9e8f77]">
            Guild moderation tools and row-level database security ensure that your scribed secrets remain safe from tampering.
          </p>
        </div>
      </div>
    </div>
  );
}
