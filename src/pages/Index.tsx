import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import FeaturesSection from "@/components/FeaturesSection";
import ProjectsSection from "@/components/ProjectsSection";
import EcosystemSection from "@/components/EcosystemSection";
import CTASection from "@/components/CTASection";
import PartnersSection from "@/components/PartnersSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <ProjectsSection />
      <CTASection />
      <EcosystemSection />
      <PartnersSection />
      <Footer />
    </div>
  );
};

export default Index;
