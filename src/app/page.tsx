"use client";

import { Navbar } from "@/components/Navbar";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Source_Serif_4 } from "next/font/google";

const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

export default function Home() {
  return (
    <div className={`min-h-screen flex flex-col overflow-hidden bg-bytelearn-back text-[#f0f4f2] ${sourceSerif.className}`}>
      <Navbar variant="landing" />

      <div className="pt-20 w-full flex-1">

        <Hero />

        <Features />

        <Footer />
      </div>
    </div>
  );
}
