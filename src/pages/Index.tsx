import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import SnapshotSection from "@/components/SnapshotSection";
import ProjectsSection from "@/components/ProjectsSection";
import HowItWorksTracks from "@/components/HowItWorksTracks";
import TractionSection from "@/components/TractionSection";
import PartnersSection from "@/components/PartnersSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <FeaturesSection />
      <SnapshotSection />
      <ProjectsSection />
      <HowItWorksTracks />
      <TractionSection />
      <PartnersSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
