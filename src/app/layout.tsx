import type { Metadata } from "next";
import { Heebo, Secular_One } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

// Display face for storefront headlines. Single weight, so never combine it
// with a bold utility (the browser would fake-bold it).
const secularOne = Secular_One({
  variable: "--font-secular",
  subsets: ["hebrew", "latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "מלבי אקספרס",
  description: "אתר הזמנות אונליין | מלבי אקספרס אשקלון",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html dir="rtl" lang="he" className={`${heebo.variable} ${secularOne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
