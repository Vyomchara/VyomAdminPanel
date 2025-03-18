import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { createRequiredBuckets } from "@/lib/uploadToBucket";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Create required buckets on app initialization
  // await createRequiredBuckets();
  
  return {
    title: "Vyom Admin Panel",
    description: "Admin dashboard for drone management system",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      > <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
        {children}
     
        <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
