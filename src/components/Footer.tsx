import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

export function Footer() {
  return (
    <footer className="bg-bytelearn-back border-t border-[rgba(255,255,255,0.15)] relative z-10 w-full mt-20">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-20 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className={`flex items-center gap-3 mb-6 ${sourceSerif.className}`}>
              <GraduationCap className="h-8 w-8 text-[#f0f4f2]" />
              <span className="text-[20px] tracking-[0.1em] uppercase italic text-[#f0f4f2]">ByteLearn</span>
            </div>
            <p className={`text-[#a8b5ae] max-w-md font-light leading-relaxed text-base ${sourceSerif.className}`}>
              Transforming education through visual learning. Learn concepts visually, one byte at a time.
            </p>
          </div>

          <div>
            <h4 className={`text-[11px] text-[#f0f4f2] uppercase tracking-[0.1em] mb-6 ${jetbrainsMono.className}`}>Product</h4>
            <ul className={`space-y-4 text-[10px] text-[#a8b5ae] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>
              <li>
                <Link href="#features" className="hover:text-[#f0f4f2] transition-colors">Features_</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#f0f4f2] transition-colors">Dashboard_</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#f0f4f2] transition-colors">Pricing_</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={`text-[11px] text-[#f0f4f2] uppercase tracking-[0.1em] mb-6 ${jetbrainsMono.className}`}>Company</h4>
            <ul className={`space-y-4 text-[10px] text-[#a8b5ae] uppercase tracking-[0.1em] ${jetbrainsMono.className}`}>
              <li><Link href="#" className="hover:text-[#f0f4f2] transition-colors">About_</Link></li>
              <li><Link href="#" className="hover:text-[#f0f4f2] transition-colors">Contact_</Link></li>
              <li><Link href="#" className="hover:text-[#f0f4f2] transition-colors">Privacy_</Link></li>
            </ul>
          </div>
        </div>

        <div className={`mt-16 pt-8 border-t border-[rgba(255,255,255,0.1)] text-left text-[9px] text-[#a8b5ae] uppercase tracking-[0.1em] flex justify-between items-center ${jetbrainsMono.className}`}>
          <p>SYSTEM.VERSION // 2.0.4</p>
          <p>© {new Date().getFullYear()} BYTE LEARN. COMPILING_</p>
        </div>
      </div>
    </footer>
  );
}
