import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MyBMAD Dashboard",
  description: "Visualize BMAD projects from GitHub",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // next-themes renders its own inline anti-flash script, which Next.js does
  // not nonce for us. Without this it is the one script the CSP rejects.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          nonce={nonce}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
