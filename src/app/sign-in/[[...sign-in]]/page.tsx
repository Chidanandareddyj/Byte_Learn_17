import { SignIn } from '@clerk/nextjs';
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

export default function Page() {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-bytelearn-back px-4 relative overflow-hidden ${sourceSerif.className}`}>
      {/* Background Grid */}
      <div className="absolute inset-0 bg-bytelearn-spatial opacity-10 pointer-events-none animate-pan-grid"></div>
      
      <div className="relative z-10 w-full max-w-md animate-fade-slide-up-1">
        <SignIn
          routing="path"
          path="/sign-in"
          redirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#f0f4f2',
              colorText: '#f0f4f2',
              colorTextSecondary: '#a8b5ae',
              colorBackground: '#003049',
              colorInputBackground: 'transparent',
              colorInputText: '#f0f4f2',
            },
            elements: {
              card: 'bg-[#003049] border border-[rgba(255,255,255,0.15)] rounded-none shadow-[0_0_40px_rgba(0,0,0,0.5)]',
              headerTitle: 'text-3xl font-light italic',
              headerSubtitle: `text-[11px] uppercase tracking-[0.1em] ${jetbrainsMono.className}`,
              formFieldLabel: `text-[10px] uppercase tracking-[0.1em] ${jetbrainsMono.className}`,
              formFieldInput: `border border-[rgba(255,255,255,0.15)] rounded-none focus:border-[#f0f4f2] transition-colors bg-transparent ${sourceSerif.className} italic`,
              formButtonPrimary: `bg-transparent border border-[#f0f4f2] text-[#f0f4f2] hover:bg-[#f0f4f2] hover:text-[#003049] rounded-none text-[12px] uppercase tracking-[0.1em] h-[52px] transition-colors ${jetbrainsMono.className}`,
              dividerLine: 'bg-[rgba(255,255,255,0.1)]',
              dividerText: `text-[10px] uppercase tracking-[0.1em] text-[#a8b5ae] ${jetbrainsMono.className}`,
              socialButtonsBlockButton: `border border-[rgba(255,255,255,0.15)] rounded-none hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#f0f4f2]`,
              socialButtonsBlockButtonText: `font-normal text-[11px] uppercase tracking-[0.1em] ${jetbrainsMono.className}`,
              footerActionLink: 'text-[#f0f4f2] hover:text-white',
              footerActionText: `text-[10px] uppercase tracking-[0.1em] text-[#a8b5ae] ${jetbrainsMono.className}`,
            }
          }}
        />
      </div>
    </div>
  )
}