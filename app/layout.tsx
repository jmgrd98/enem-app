import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { UserScoreProvider } from "@/context/UserScoreContext";
import { ExamTimeProvider } from "@/context/ExamTimeContext";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "Gerador de Simulado ENEM",
  description: "Gerador de Simulado ENEM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <UserScoreProvider>
          <ExamTimeProvider>
        <html lang="en">
          <body
            className={`${inter.className} antialiased`}
          >
            {children}
            <Toaster/>
          </body>
        </html>
          </ExamTimeProvider>
        </UserScoreProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
