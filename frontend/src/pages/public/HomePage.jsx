import React from "react";
import HeroSection from "../../components/home/HeroSection";
import TrustBadgesSection from "../../components/home/TrustBadgesSection";
import CategoryGridSection from "../../components/home/CategoryGridSection";
import FlashSaleSection from "../../components/home/FlashSaleSection";
import FeaturedProductsSection from "../../components/home/FeaturedProductsSection";
import FarmJourneySection from "../../components/home/FarmJourneySection";
import GreenhouseShowcaseSection from "../../components/home/GreenhouseShowcaseSection";

export default function HomePage() {
  const handleAddToCart = (product) => {
    console.log("Thêm vào giỏ hàng:", product);
  };

  return (
    <div className="bg-[#f8faf8] min-h-screen pb-4">
      <HeroSection />
      <TrustBadgesSection />
      <CategoryGridSection />
      <FlashSaleSection onAddToCart={handleAddToCart} />
      <FeaturedProductsSection onAddToCart={handleAddToCart} />
      <FarmJourneySection />
      <GreenhouseShowcaseSection />
    </div>
  );
}