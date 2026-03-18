import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <div className="container max-w-7xl mx-auto px-6 md:px-8 py-8">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
