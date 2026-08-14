import { QrCode, Coffee, CreditCard } from 'lucide-react';

const features = [
  {
    icon: <QrCode className="h-8 w-8 text-primary" />,
    title: 'Scan QR',
    description: 'Find the QR code on your table and scan it using your smartphone to view our digital menu instantly.',
  },
  {
    icon: <Coffee className="h-8 w-8 text-primary" />,
    title: 'Order & Customize',
    description: 'Select your favorite coffee and customize it exactly how you like it. No waiting in line.',
  },
  {
    icon: <CreditCard className="h-8 w-8 text-primary" />,
    title: 'Pay Seamlessly',
    description: 'Complete your payment digitally using various e-wallet or bank transfer options securely.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-4">How It Works</h2>
          <p className="text-muted-text max-w-2xl mx-auto text-lg">Seamless ordering experience right from your seat.</p>
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
