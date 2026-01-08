import LightRays from "@/components/ui/lightrays";
import Header from "@/components/layouts/Header";
import HeroText from "@/components/layouts/HeroText";
import Features from "@/components/layouts/Features";
import { Footer } from "@/components/layouts/Footer";
import Testimonials from "@/components/ui/Testimonials";
import Pricing from "@/components/layouts/Pricing";
import { Case } from "@/components/ui/cases-with-infinite-scroll";


const HomePage = () => {
  return (
    <div className="relative min-h-screen transition-colors bg-black">
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#33E6FF"
          raysSpeed={1.5}
          lightSpread={2}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
        />
      </div>
      {/* Navbar */}
      <Header />
      {/* Page Content */}
      <HeroText />
      {/*Features Page*/}
      <Features />

      <Pricing />
 
      <Testimonials />

      <Case  />
      {/*Footer*/}
      <Footer />

    </div>
  );
};

export default HomePage;
