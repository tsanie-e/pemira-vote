import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Dashboard Admin Pemira",
  },
  description: "Dashboard admin untuk pengelolaan token dan statistik pemira.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
