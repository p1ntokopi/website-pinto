import Image from 'next/image';

export function GallerySection() {
  return (
    <section className="w-full bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 max-w-7xl mx-auto">
          {/* Top Row */}
          <div className="col-span-1 md:col-span-8 relative aspect-[16/9] md:aspect-[4/3] bg-ink/5 rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1600&auto=format&fit=crop" alt="Cafe interior" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
          <div className="col-span-1 md:col-span-4 relative aspect-[4/5] md:aspect-[3/4] bg-ink/5 mt-0 md:mt-24 rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=800&auto=format&fit=crop" alt="Coffee details" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
          
          {/* Bottom Row */}
          <div className="col-span-1 md:col-span-5 relative aspect-square bg-ink/5 mt-4 md:-mt-32 rounded-sm overflow-hidden group z-10 shadow-2xl">
            <Image src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=800&auto=format&fit=crop" alt="Barista working" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
          <div className="col-span-1 md:col-span-7 relative aspect-[16/9] md:aspect-[21/9] bg-ink/5 mt-4 md:mt-12 rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=1600&auto=format&fit=crop" alt="Coffee beans" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
        </div>
      </div>
    </section>
  );
}
