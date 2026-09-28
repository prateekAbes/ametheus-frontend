import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

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
    icon: [
      { url: "/ametheus-icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/ametheus-icon.png",
    apple: [
      { url: "/ametheus-icon.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var t = localStorage.getItem('ametheus_theme') || 'dark';
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            })()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8F9FA] dark:bg-[#0B0E16] text-[#0F172A] dark:text-[#F8FAFC] transition-colors duration-200">
        <ClerkProvider>
          <AuthProvider>
            <ThemeProvider>
              {/* Dark Arena Header */}
              <Header />

              {/* Operational Canvas */}
              <main className="flex-1 w-full pt-16">{children}</main>

              {/* Dark Arena Footer */}
              <Footer />
            </ThemeProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}