import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';

const BELIEFS = [
  {
    word: 'Kualitas.',
    desc: 'Biji pilihan dari kebun-kebun mitra di Nusantara — dipilih dengan teliti, disangrai dalam batch kecil.',
  },
  {
    word: 'Ketelitian.',
    desc: 'Setiap cangkir diracik dengan presisi yang sama, dari shot pertama hingga shot terakhir hari itu.',
  },
  {
    word: 'Sumber yang bertanggung jawab.',
    desc: 'Biji yang bersumber secara etis, untuk mendukung komunitas petani yang menanamnya.',
  },
  {
    word: 'Kopi yang dibuat dengan hati.',
    desc: 'Setiap cangkir diseduh dengan semangat dan niat baik — untuk orang yang menunggu di seberang bar.',
  },
];

export function StoryManifesto() {
  return (
    <section className="w-full border-t border-ink/10 bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-28">
        <RevealFade>
          <p className="mb-10 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
            <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
            03 — Kami Percaya
          </p>
        </RevealFade>

        <RevealHeading
          as="h2"
          lines={[
            'Kami percaya pada',
            { text: 'kopi yang dibuat', italic: true },
            'dengan perhatian.',
          ]}
          className="max-w-4xl font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[1.02] tracking-tight text-ink"
        />

        <ul className="mt-14 md:mt-20">
          {BELIEFS.map((belief, i) => (
            <RevealFade key={belief.word} delay={0.05 * i}>
              <li className="grid grid-cols-1 gap-3 border-t border-ink/10 py-8 last:border-b md:grid-cols-12 md:items-baseline md:gap-8 md:py-10">
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground md:col-span-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-3xl leading-tight text-ink md:col-span-6 md:text-4xl">
                  {belief.word}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground md:col-span-5">
                  {belief.desc}
                </p>
              </li>
            </RevealFade>
          ))}
        </ul>
      </div>
    </section>
  );
}