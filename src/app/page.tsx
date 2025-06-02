import { Header } from "@/components/home/Header";
import { HomeFooter } from "@/components/home/Footer";
import { HomeContent } from "@/components/home/HomeContent";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HomeContent />
      <HomeFooter />
    </div>
  );
}
