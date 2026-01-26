import { Suspense, lazy } from "react";
import Header from "@/components/layouts/Header";
import HeroText from "@/components/layouts/HeroText";
import BgAnimation from "@/components/layouts/BgAnimation";

// Lazy load below-the-fold components for better initial load performance
const Features = lazy(() => import("@/components/layouts/Features"));
const Footer = lazy(() => import("@/components/layouts/Footer").then(module => ({ default: module.Footer })));
const Testimonials = lazy(() => import("@/components/ui/Testimonials"));
const Pricing = lazy(() => import("@/components/layouts/Pricing"));
const Case = lazy(() => import("@/components/ui/cases-with-infinite-scroll").then(module => ({ default: module.Case })));

// Loading component for below-the-fold sections
const SectionLoader = () => (
  <div className="flex justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
  </div>
);

const HomePage = () => {
  return (
    <div className="relative min-h-screen transition-colors bg-black">
      <BgAnimation />
      {/* Navbar */}
      <Header />
      {/* Page Content */}
      <HeroText />
      
      {/* Lazy loaded below-the-fold components */}
      <Suspense fallback={<SectionLoader />}>
        {/*Features Page*/}
        <Features />
        {/* Pricing Page */}
        <Pricing />
        {/* Testimonials */}
        <Testimonials />
        {/* Carousel */}
        <Case />
        {/*Footer*/}
        <Footer />
      </Suspense>
    </div>
  );
};

export default HomePage;
