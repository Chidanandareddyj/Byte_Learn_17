import { GraduationCap } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Byte Learn</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Transforming education through visual learning. Learn concepts visually, one byte at a time.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Byte Learn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
