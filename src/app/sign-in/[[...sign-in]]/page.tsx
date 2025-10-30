import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center notebook-bg px-4">
      <div className="w-full max-w-md">
        <SignIn
          routing="path"
          path="/sign-in"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
              card: 'shadow-xl border-2',
              headerTitle: 'text-2xl font-serif',
              headerSubtitle: 'text-muted-foreground',
              formFieldInput: 'border-2 focus:border-primary',
              footerActionLink: 'text-primary hover:text-primary/80'
            }
          }}
        />
      </div>
    </div>
  )
}