import type { Metadata } from "next";
import { Abhaya_Libre } from "next/font/google";
import "./globals.css";

const abhayaLibre = Abhaya_Libre({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-abhaya-libre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Website Voting Pemilu Raya",
  description: "Halaman cover dan input PIN untuk pemilu raya.",
  icons: {
    icon: "/assets/mppk.png",
    shortcut: "/assets/mppk.png",
    apple: "/assets/mppk.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${abhayaLibre.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
