import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AMETHEUS — Online Esports Tournament Platform",
  description:
    "Enter the competition. High-stakes esports tournaments, automated brackets, verified results, and instant team competition.",
  icons: {
    icon: "/brand/ametheus-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-[#0F172A]">
        <AuthProvider>
          {/* Dark Arena Header */}
          <Header />

          {/* Daylight Operational Canvas */}
          <main className="flex-1 w-full pt-16">{children}</main>

          {/* Dark Arena Footer */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
