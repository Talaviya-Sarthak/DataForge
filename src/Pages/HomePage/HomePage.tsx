import Header from "@/components/layouts/Header";
import HeroText from "@/components/layouts/HeroText";
import Features from "@/components/layouts/Features";
import { Footer } from "@/components/layouts/Footer";
import Testimonials from "@/components/ui/Testimonials";
import Pricing from "@/components/layouts/Pricing";
import { Case } from "@/components/ui/cases-with-infinite-scroll";
import BgAnimation from "@/components/layouts/BgAnimation";


const HomePage = () => {
  return (
    <div className="relative min-h-screen transition-colors bg-black">
     <BgAnimation/>
      {/* Navbar */}
      <Header />
      {/* Page Content */}
      <HeroText />
      {/*Features Page*/}
      <Features />
      {/* Pricing Page */}
      <Pricing />
      {/* Testimmonials */}
      <Testimonials />
      {/* Carousel */}
      <Case  />
      {/*Footer*/}
      <Footer />

    </div>
  );
};

export default HomePage;
