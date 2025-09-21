
import LandingPage from "./components/LandingPage";
import HowItWorks from "./howItWorks/page";
import Features from "./features/page";
import PageDivider from "./components/PageDivider";
import CategoriesSection from "./categories/page";
import Testimonies from "./testimonies/page";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div >
       <LandingPage />
        <HowItWorks/>
        <Features />
        <PageDivider />
        <CategoriesSection />
        <Testimonies />
        <Footer />
    </div>
  );
}
