"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { GraduationCap } from "lucide-react";
import { Button } from "./ui/button";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

interface NavbarProps {
  variant?: "landing" | "app";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  if (variant === "landing") {
    return (
      <nav className={`fixed top-10 left-8 lg:left-20 right-8 lg:right-20 flex items-center justify-between z-[100] animate-fade-slide-up-1`}>
        <Link href="/" className={`text-[#f0f4f2] text-[20px] tracking-[0.1em] uppercase italic ${sourceSerif.className}`}>
          ByteLearn
        </Link>
        <div className={`flex items-center gap-10 ${jetbrainsMono.className}`}>
          <div className="hidden md:flex gap-10">
            <Link href="#features" className="text-[#a8b5ae] text-[11px] tracking-[0.1em] uppercase transition-colors hover:text-[#f0f4f2]">Features</Link>
          </div>
          <div className="flex items-center gap-6">
            <SignedOut>
              <Link href="/sign-in" className="text-[#a8b5ae] text-[11px] tracking-[0.1em] uppercase transition-colors hover:text-[#f0f4f2]">
                Log In
              </Link>
              <Link href="/sign-up" className="flex items-center justify-center px-6 h-10 border border-[rgba(255,255,255,0.25)] text-[#f0f4f2] text-[11px] tracking-[0.1em] uppercase transition-all duration-300 hover:bg-[#f0f4f2] hover:text-[#003049]">
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="text-[#a8b5ae] text-[11px] tracking-[0.1em] uppercase transition-colors hover:text-[#f0f4f2]">
                Dashboard
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: {
                    colorPrimary: '#f0f4f2',
                    colorText: '#f0f4f2',
                    colorTextSecondary: '#a8b5ae',
                    colorBackground: '#003049',
                    fontFamily: jetbrainsMono.style.fontFamily,
                  },
                  elements: {
                    avatarBox: "h-8 w-8 ring-1 ring-[#ffffff40] rounded-none cursor-pointer",
                    userButtonPopoverCard: "bg-[#003049] border border-[rgba(255,255,255,0.15)] rounded-none shadow-[0_0_40px_rgba(0,0,0,0.5)]",
                    userButtonPopoverActionButton: "hover:bg-[rgba(255,255,255,0.05)] text-[#f0f4f2]",
                    userButtonPopoverActionButtonText: "text-[#f0f4f2]",
                    userButtonPopoverActionButtonIcon: "text-[#a8b5ae]",
                    userPreviewMainIdentifier: `text-[#f0f4f2] ${jetbrainsMono.className}`,
                    userPreviewSecondaryIdentifier: `text-[#a8b5ae] ${jetbrainsMono.className}`,
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>
    );
  }

  // Application Navbar (Theorum Dashboard Layout)
  return (
    <nav className="h-[80px] px-10 flex items-center justify-between border-b border-[rgba(255,255,255,0.15)] z-[100] bg-bytelearn-back fixed top-0 w-full left-0">
      <Link href="/" className="flex items-center gap-3 transition-transform hover:-translate-y-0.5" data-testid="link-home">
        <GraduationCap className="h-6 w-6 text-[#f0f4f2]" />
        <span className={`text-[#f0f4f2] text-[20px] tracking-[0.05em] uppercase italic font-light ${sourceSerif.className}`}>ByteLearn</span>
      </Link>

      <div className="flex items-center gap-6">
        <SignedOut>
          <Link href="/dashboard" className={`text-[#f0f4f2] text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer hover:text-white ${jetbrainsMono.className}`} data-testid="button-dashboard">
            Dashboard
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className={`text-[#f0f4f2] text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer hover:text-white ${jetbrainsMono.className}`} data-testid="button-dashboard">
            Dashboard
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              variables: {
                colorPrimary: '#f0f4f2',
                colorText: '#f0f4f2',
                colorTextSecondary: '#a8b5ae',
                colorBackground: '#003049',
                fontFamily: jetbrainsMono.style.fontFamily,
              },
              elements: {
                avatarBox: "h-8 w-8 ring-1 ring-[#ffffff40] rounded-none cursor-pointer",
                userButtonPopoverCard: "bg-[#003049] border border-[rgba(255,255,255,0.15)] rounded-none shadow-[0_0_40px_rgba(0,0,0,0.5)]",
                userButtonPopoverActionButton: "hover:bg-[rgba(255,255,255,0.05)] text-[#f0f4f2]",
                userButtonPopoverActionButtonText: "text-[#f0f4f2]",
                userButtonPopoverActionButtonIcon: "text-[#a8b5ae]",
                userPreviewMainIdentifier: `text-[#f0f4f2] ${jetbrainsMono.className}`,
                userPreviewSecondaryIdentifier: `text-[#a8b5ae] ${jetbrainsMono.className}`,
              }
            }}
          />
        </SignedIn>

        <ThemeToggle />
      </div>
    </nav>
  );
}

