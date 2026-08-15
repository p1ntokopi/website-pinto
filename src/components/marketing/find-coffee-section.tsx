'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

const TABS = ["ROAST", "FLAVOR", "BREW"];
const OPTIONS = {
  ROAST: ["Light", "Medium", "Dark"],
  FLAVOR: ["Fruity", "Chocolate", "Nutty", "Floral", "Sweet"],
  BREW: ["Espresso", "V60", "French Press", "AeroPress", "Cold Brew"]
};

export function FindCoffeeSection() {
  const [activeTab, setActiveTab] = useState("ROAST");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelectedOption(option === selectedOption ? null : option);
  };

  return (
    <section className="w-full bg-paper py-24 md:py-32 border-b border-ink/5 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-5xl md:text-6xl text-ink mb-6">Temukan Kopi Anda.</h2>
          <p className="text-muted-foreground text-xl">Bingung mau menyeduh apa?<br/>Mulai dari rasa yang Anda sukai.</p>
        </div>

        <div className="flex justify-center gap-8 mb-12 border-b border-ink/10">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedOption(null); }}
              className={`pb-4 text-sm font-semibold tracking-widest uppercase transition-colors relative focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${activeTab === tab ? 'text-ink' : 'text-muted-foreground hover:text-ink/70'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[120px] flex flex-wrap justify-center gap-4 mb-16">
          <AnimatePresence mode="popLayout">
            {OPTIONS[activeTab as keyof typeof OPTIONS].map((option) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleSelect(option)}
                className={`px-8 py-3 rounded-full border text-sm md:text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  selectedOption === option 
                  ? 'bg-ink border-ink text-paper' 
                  : 'bg-transparent border-ink/20 text-ink hover:border-ink/50'
                }`}
              >
                {option}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedOption && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-ink/5 rounded-sm p-8"
            >
              <p className="text-ink text-lg mb-6">
                Kami menemukan <span className="font-semibold text-coffee">4 kopi</span> yang cocok dengan selera Anda untuk {selectedOption}.
              </p>
              <Link href={`/coffee?filter=${selectedOption.toLowerCase()}`} className={buttonVariants({ variant: "default", className: "rounded-full px-8 bg-ink text-paper hover:bg-ink/90 shadow-none" })}>
                Lihat Hasil
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
