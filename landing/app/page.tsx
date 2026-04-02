import Navigation from "./components/navigation";
import Hero from "./components/hero";
import FeaturesGrid from "./components/features-grid";
import HowItWorks from "./components/how-it-works";
import FormatsShowcase from "./components/formats-showcase";
import CTASection from "./components/cta-section";
import Footer from "./components/footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <FeaturesGrid />
        <HowItWorks />
        <FormatsShowcase />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
