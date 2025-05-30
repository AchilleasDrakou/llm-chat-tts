import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

// Font optimization
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Metadata for SEO
export const metadata: Metadata = {
  title: "LLM Chat with TTS",
  description: "Chat with an AI assistant that can speak using Chatterbox TTS",
  keywords: ["AI", "chat", "text-to-speech", "TTS", "Chatterbox", "Next.js"],
  authors: [{ name: "Factory AI" }],
  creator: "Factory AI",
  publisher: "Factory AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://llm-chat-tts.vercel.app",
    title: "LLM Chat with TTS",
    description: "Chat with an AI assistant that can speak using Chatterbox TTS",
    siteName: "LLM Chat with TTS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LLM Chat with TTS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LLM Chat with TTS",
    description: "Chat with an AI assistant that can speak using Chatterbox TTS",
    images: ["/og-image.png"],
  },
};

// Viewport settings for responsive design
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Root layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-screen flex-col">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
