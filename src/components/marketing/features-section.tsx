import { QrCode, Coffee, CreditCard } from 'lucide-react';

const features = [
  {
    icon: <QrCode className="h-8 w-8 text-primary" />,
    title: 'Pindai QR',
    description: 'Temukan kode QR di meja Anda dan pindai dengan ponsel untuk melihat menu digital kami secara instan.',
  },
  {
    icon: <Coffee className="h-8 w-8 text-primary" />,
    title: 'Pesan & Sesuaikan',
    description: 'Pilih kopi favorit Anda dan sesuaikan persis seperti yang Anda suka. Tanpa antre.',
  },
  {
    icon: <CreditCard className="h-8 w-8 text-primary" />,
    title: 'Bayar Tanpa Ribet',
    description: 'Selesaikan pembayaran secara digital menggunakan berbagai e-wallet atau transfer bank dengan aman.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-4">Cara Kerjanya</h2>
          <p className="text-muted-text max-w-2xl mx-auto text-lg">Pengalaman memesan tanpa hambatan, langsung dari tempat duduk Anda.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group flex flex-col items-center text-center p-8 rounded-3xl bg-paper/30 border border-border hover:bg-paper/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
            >
              <div className="h-20 w-20 bg-cream/50 group-hover:bg-cream rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">{feature.title}</h3>
              <p className="text-muted-text leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
