import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Attendance & Agent Audit Manager",
  description: "Team attendance & agent call audit system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8F7F4] text-[#121212] antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
