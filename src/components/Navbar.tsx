"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface NavbarProps {
  variant?: "landing" | "app";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2" data-testid="link-home">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Byte Learn</span>
          </Link>

          <div className="flex items-center gap-4">
            <SignedOut>
              {variant === "landing" ? (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" data-testid="button-login">Log In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button data-testid="button-signup">Get Started</Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard">
                  <Button variant="ghost" data-testid="button-dashboard">Dashboard</Button>
                </Link>
              )}
            </SignedOut>
            
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" data-testid="button-dashboard">Dashboard</Button>
              </Link>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}


