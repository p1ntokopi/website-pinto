export function BeanToCupSection() {
  return (
    <section className="w-full bg-paper py-24 md:py-32 border-b border-ink/5 relative">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="font-display text-6xl md:text-[8rem] text-ink leading-none mb-24 max-w-4xl">
          FROM BEAN<br/>TO CUP.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8">
          <div className="flex flex-col gap-32 pb-32">
            {[
              { num: "01", title: "SOURCE", desc: "Carefully selected beans from the world's best farms, emphasizing sustainability and fair trade." },
              { num: "02", title: "ROAST", desc: "Small-batch roasting in-house to bring out the unique character of every origin." },
              { num: "03", title: "BREW", desc: "Prepared with precision by our baristas, using dialed-in recipes for every specific bean." },
              { num: "04", title: "ENJOY", desc: "Served fresh at P1NTO, or packed perfectly for you to brew at home." }
            ].map((step, idx) => (
              <div key={idx} className="max-w-sm">
                <span className="text-warm font-display text-4xl mb-4 block">{step.num}</span>
                <h3 className="font-display text-3xl text-ink mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="hidden md:block relative h-full">
            <div className="sticky top-32 w-full aspect-[3/4] bg-ink/5 rounded-sm overflow-hidden">
               <img src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Coffee Process" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
