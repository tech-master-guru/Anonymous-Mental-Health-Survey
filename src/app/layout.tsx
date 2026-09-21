import type { Metadata } from "next";
import "../app/globals.css";
import ClientLayout from "../app/ClientLayout";

export const metadata: Metadata = {
  title: "AMHS — Anonymous Mental Health Survey | Midnight Network",
  description: "Privacy-preserving zero-knowledge mental health assessment and wellness survey platform on Midnight Network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
