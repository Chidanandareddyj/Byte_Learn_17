"use client";

import { Navbar } from "@/components/Navbar";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden text-chalk">
      <Navbar variant="landing" />

      <div className="pt-20 w-full flex-1">

        <Hero />

        <Features />

        <Footer />
      </div>
    </div>
  );
}
