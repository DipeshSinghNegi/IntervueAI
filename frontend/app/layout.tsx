
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "./provider";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "IntervueAI",
  description: "IntervueAI is an AI-powered interview simulation platform designed to help you prepare for job interviews with personalized practice and feedback.",
  keywords: [
    "AI interview simulator",
    "job interview preparation",
    "interview practice",
    "AI-powered interviews",
    "personalized interview feedback",
  ],
  icons: {
    icon: "/jsm-logo.png",
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/jsm-logo.png" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <div id="portal-root" />
        </ThemeProvider>
      </body>
    </html>
  );
}
