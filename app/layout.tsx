import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ImgBazar by Velora - Free Image Hosting",
  description: "Upload Image, Get Direct Link, HTML, Markdown, BBCode Instantly. No Login. Free.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0A0A14" }}>{children}</body>
    </html>
  );
}
