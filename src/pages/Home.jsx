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

const MEASUREMENT_IMAGES = {
  spine: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/ac0856d24_generated_869a708b.png",
  shoulders: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/86888d215_generated_b0004176.png",
  pelvis: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/37108d317_generated_698312f1.png",
  knees: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/4b35bb0bd_generated_4d2bfc6b.png",
  feet: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/050afc8ae_generated_a589db8a.png",
  dynamic: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/1a81d1eaf_generated_93288630.png",
  breathing: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/ec56514ef_generated_896cd33c.png",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection heroImage={HERO_IMAGE} />
      <PostureCompare />
      <FeatureCards />
      <MeasurementGrid images={MEASUREMENT_IMAGES} />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}