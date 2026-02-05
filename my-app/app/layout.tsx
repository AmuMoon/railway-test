import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dota 2 Analytics",
  description: "Track and analyze Dota 2 player statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-2">
                <Gamepad2 className="w-8 h-8 text-orange-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Dota 2 Analytics
                </span>
              </Link>
              <div className="flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-gray-300 hover:text-orange-500 transition-colors"
                >
                  Search
                </Link>
                <Link 
                  href="/leaderboard" 
                  className="text-gray-300 hover:text-orange-500 transition-colors"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}