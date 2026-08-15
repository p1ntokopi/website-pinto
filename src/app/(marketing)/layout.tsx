import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { AnnouncementBar } from '@/components/marketing/announcement-bar';
import { SmoothScroll } from '@/components/providers/smooth-scroll';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SmoothScroll>
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </SmoothScroll>
    </div>
  );
}
