import Image from 'next/image';

export const metadata = {
  title: 'Jurnal | P1NTO Coffee',
  description:
    'Cerita, panduan menyeduh, dan catatan dari roastery — jurnal P1NTO.',
};

const articles = [
  {
    category: 'Panduan Seduh',
    title: 'V60, Dijelaskan: Menyeduh Lebih Baik di Rumah',
    excerpt:
      'Dari ukuran gilingan hingga teknik tuang — penyesuaian kecil yang mengubah cangkir biasa menjadi luar biasa.',
    date: 'Segera hadir',
    readTime: '6 menit baca',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=900&auto=format&fit=crop',
  },
  {
    category: 'Dari Roastery',
    title: 'Mengapa Kami Menyangrai dalam Batch Kecil',
    excerpt:
      'Kesegaran adalah rasa. Begini cara penyangraian batch kecil mengubah segalanya dalam cangkir Anda.',
    date: 'Segera hadir',
    readTime: '4 menit baca',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=900&auto=format&fit=crop',
  },
  {
    category: 'Kisah Biji',
    title: 'Perjalanan Panjang dari Dataran Tinggi Gayo ke Bar Anda',
    excerpt:
      'Kenali petani di balik single origin Aceh kami — dan proses yang membawa karya mereka melintasi lautan.',
    date: 'Segera hadir',
    readTime: '7 menit baca',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=900&auto=format&fit=crop',
  },
  {
    category: 'Ritual',
    title: 'Ritual Pagi, Ditinjau Ulang',
    excerpt:
      'Kami bertanya pada barista bagaimana mereka memulai hari. Berhenti sejenak bersama mereka sebelum dunia berjalan cepat.',
    date: 'Segera hadir',
    readTime: '3 menit baca',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=900&auto=format&fit=crop',
  },
];

export default function JournalPage() {
  return (
    <>
      <section className="w-full bg-paper py-24 md:py-32 border-b border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-6">Jurnal</p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink leading-[1.05] mb-6">
            Catatan dari Roastery
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Cerita, panduan menyeduh, dan ritual kecil — ditulis di sela-sela shot di bar.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
            {articles.map((article) => (
              <article
                key={article.title}
                className="group flex flex-col cursor-default"
                aria-disabled
              >
                <div className="relative aspect-[4/3] w-full mb-6 overflow-hidden rounded-sm bg-ink/5">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee">
                    {article.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{article.date}</span>
                </div>
                <h2 className="font-display text-3xl text-ink mb-3 leading-tight">{article.title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{article.excerpt}</p>
                <span className="text-xs text-muted-foreground uppercase tracking-widest mt-auto">
                  {article.readTime}
                </span>
              </article>
            ))}
          </div>

          <div className="mt-20 border border-ink/10 bg-ink/5 rounded-sm p-10 md:p-14 text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-4">Masih ada cerita yang sedang diseduh</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Entri jurnal baru sedang dalam perjalanan. Sementara itu, jelajahi roastery dan ambil satu kantong untuk seduhan berikutnya.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}