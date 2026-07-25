import React from "react";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import MeasurementGrid from "@/components/landing/MeasurementGrid";
import PricingSection from "@/components/landing/PricingSection";
import PostureCompare from "@/components/landing/PostureCompare";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

const HERO_IMAGE = "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/a1151567e_generated_1ca500cb.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection heroImage={HERO_IMAGE} />
      <PostureCompare />
      <FeatureCards />
      <MeasurementGrid />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}