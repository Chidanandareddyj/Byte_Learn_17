import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar variant="landing" />
      <div className="flex flex-1 items-center justify-center px-5 pt-[72px]">
        <div className="board w-full max-w-[520px] px-8 py-10 text-center">
          <p className="hand text-[30px] text-pink">this page isn&apos;t on the board</p>
          <h1 className="mt-2 font-serif italic text-[34px] text-chalk">Page not found</h1>
          <p className="mt-2 text-muted-foreground">The page you are looking for does not exist.</p>
          <Link href="/" className="btn-pill btn-pill-primary mt-6">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
