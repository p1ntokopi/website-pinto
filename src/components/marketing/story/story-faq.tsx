import { RevealFade } from '@/components/marketing/reveal-heading';
import { WhatsAppLink } from '@/components/marketing/coffee/whatsapp-link';

/**
 * TANYA JAWAB — Pinto
 * -------------------------------------------------------------
 * Tambahkan pertanyaan baru di array `FAQ` di bawah.
 * Format: { q: 'Pertanyaan', a: 'Jawaban' }
 * Gunakan informasi yang benar-benar akurat tentang Pinto.
 */
const FAQ = [
  {
    q: 'Di mana lokasi Pinto?',
    a: 'Perumahan Bumi Insani, Jl. Flamboyan No. 8, Tajur Halang, Kabupaten Bogor.',
  },
  {
    q: 'Jam buka kafe?',
    a: 'Setiap hari, pukul 13.00 hingga 24.00.',
  },
  {
    q: 'Bagaimana cara memesan di kafe?',
    a: 'Scan kode QR di meja Anda untuk membuka menu dan memesan langsung dari ponsel — tanpa antre.',
  },
  {
    q: 'Bagaimana cara membeli biji kopi?',
    a: 'Chat kami via WhatsApp untuk memesan biji kopi sangrai, atau langsung ambil di kafe. Biji kami disangrai in-house dalam batch kecil.',
  },
];

export function StoryFaq() {
  return (
    <section className="w-full border-t border-ink/10 bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <RevealFade className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
              Tanya Jawab
            </p>
          </RevealFade>

          <div className="lg:col-span-9">
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight text-ink">
              Ada yang ingin ditanyakan?
            </h2>

            <dl className="mt-10">
              {FAQ.map((item, i) => (
                <RevealFade key={item.q} delay={0.05 * i}>
                  <div className="grid grid-cols-1 gap-3 border-t border-ink/10 py-8 last:border-b md:grid-cols-12 md:gap-8">
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground md:col-span-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <dt className="font-display text-2xl leading-snug text-ink md:col-span-5">
                      {item.q}
                    </dt>
                    <dd className="text-base leading-relaxed text-muted-foreground md:col-span-6">
                      {item.a}
                    </dd>
                  </div>
                </RevealFade>
              ))}
            </dl>

            <RevealFade delay={0.1}>
              <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                Pertanyaan lain?
                <WhatsAppLink>Chat kami via WhatsApp</WhatsAppLink>
              </p>
            </RevealFade>
          </div>
        </div>
      </div>
    </section>
  );
}