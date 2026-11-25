import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imgbazar.pages.dev"),
  title: "ImgBazar - Free Image Hosting | Upload Image & Get Direct Link",
  description: "ImgBazar is a free image hosting tool. Upload image, get direct link, markdown, HTML, BBCode, Blogger, WordPress link instantly. No login, unlimited bandwidth, QR code & delete link free.",
  keywords: ["free image hosting", "upload image", "image hosting", "get image link", "direct image link", "imgbb alternative", "postimages alternative", "free image upload", "blogger image hosting", "wordpress image upload", "image to link", "photo upload link"],
  authors: [{ name: "Velora" }],
  robots: "index, follow",
  openGraph: {
    title: "ImgBazar - Free Image Hosting | Upload Image Get Link",
    description: "Upload Image. Get Link. Use Anywhere. Blogger, WordPress, Reddit, Forums - 9 Tarah ke Link Instantly!",
    url: "https://imgbazar.pages.dev",
    siteName: "ImgBazar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImgBazar - Free Image Hosting",
    description: "Free Image Hosting - No Login, Unlimited Bandwidth",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "ImgBazar kya hai?", "acceptedAnswer": { "@type": "Answer", "text": "ImgBazar ek free image hosting tool hai. Yahan aap bina login ke image upload karke direct link, markdown, HTML, BBCode link pa sakte hai." } },
      { "@type": "Question", "name": "Kya ImgBazar free hai?", "acceptedAnswer": { "@type": "Answer", "text": "Haan, ImgBazar 100% free hai. No login, no limit, unlimited bandwidth." } },
      { "@type": "Question", "name": "Photo ko permanent kaise delete kare?", "acceptedAnswer": { "@type": "Answer", "text": "Photo ke paas Delete Permanent button hai ya Delete Link copy karke kisi ko bhej sakte hai. Delete karne par photo Cloudinary se hamesha ke liye delete ho jayegi." } },
      { "@type": "Question", "name": "Blogger me image kaise lagaye?", "acceptedAnswer": { "@type": "Answer", "text": "ImgBazar se Blogger link copy kare aur Blogger post me HTML me paste kar de." } },
    ]
  };
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </head>
      <body style={{ margin: 0, background: "#0A0A14" }}>{children}</body>
    </html>
  );
}
