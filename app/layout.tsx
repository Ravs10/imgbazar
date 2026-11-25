import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imgbazar.pages.dev"),
  verification: {
    google: "w_wvZBVQdtjW8zt-02VoE47Y4Tm7sOjySsoFsTfwnpk",
  },
  title: "ImgBazar - Free Image Hosting | Upload Image & Get Direct Link",
  description: "ImgBazar is a free image hosting tool...",
  // ... baaki sab same rahega
  keywords: ["free image hosting", "upload image", "image hosting", "get image link", "direct image link", "imgbb alternative", "postimages alternative", "free image upload", "blogger image hosting", "wordpress image upload", "image to link", "photo upload link", "how to upload image", "bulk delete image", "image to direct link"],
  authors: [{ name: "Velora" }],
  robots: "index, follow",
  alternates: { canonical: "https://imgbazar.pages.dev" },
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
      { "@type": "Question", "name": "What is ImgBazar and how does it work?", "acceptedAnswer": { "@type": "Answer", "text": "ImgBazar is a completely free image hosting website. You upload an image, it is stored on Cloudinary's global CDN, and you instantly get a permanent direct link plus 8 other link formats (Markdown, HTML, BBCode, Blogger, WordPress, Reddit, Forum, Thumbnail). No login, no signup. The image stays online forever unless you explicitly delete it." } },
      { "@type": "Question", "name": "Is ImgBazar really 100% free? Are there hidden limits?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, ImgBazar is completely free forever. There are no view limits, no bandwidth caps, no watermarks, no premium tiers, and no forced ads. You can upload as many images as you want, from as many devices as you want." } },
      { "@type": "Question", "name": "Will my uploaded photo stay online forever?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. As long as you do not click Delete Permanent, your image stays on Cloudinary's servers indefinitely. There is no automatic expiry. Links stay active forever." } },
      { "@type": "Question", "name": "How do I permanently delete a photo from Cloudinary?", "acceptedAnswer": { "@type": "Answer", "text": "Open any photo, click Delete Permanent button. A confirmation appears. Press OK, ImgBazar takes you to a dedicated Delete Page. Click Yes, Delete Forever and the image is instantly removed from Cloudinary. All links to that image will now show as broken." } },
      { "@type": "Question", "name": "Can I bulk delete multiple photos at once?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! Click Bulk Select below the History header. Every card shows a checkbox. Tap photos to select them or click Select All. Then choose Remove N or Delete Permanent N. Bulk delete uses the /api/delete endpoint to process each image." } },
      { "@type": "Question", "name": "Is ImgBazar better than ImgBB and Postimages?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. ImgBazar offers No-login upload like ImgBB but with Bulk Delete, QR code generation for every image, Copy Delete Link to share deletion control without account access, and 9 link formats including Thumbnail auto-resize." } },
      { "@type": "Question", "name": "How do I paste a screenshot directly without saving it?", "acceptedAnswer": { "@type": "Answer", "text": "Press Ctrl+V on Windows/Linux or Cmd+V on Mac anywhere on the ImgBazar page. If your clipboard contains an image, it will auto-upload instantly. No need to save a temp file first." } },
      { "@type": "Question", "name": "What is the maximum image file size I can upload?", "acceptedAnswer": { "@type": "Answer", "text": "ImgBazar supports images up to 10 MB per file. Supported formats include JPG, PNG, GIF, WebP, BMP, SVG, and AVIF. For larger images, compress them first." } },
      { "@type": "Question", "name": "How do I embed ImgBazar images in a Blogger post?", "acceptedAnswer": { "@type": "Answer", "text": "Click the image, select the Blogger tab, copy the full HTML tag. In Blogger post editor, switch to HTML view, paste the code, click Preview. The image appears." } },
      { "@type": "Question", "name": "Will my image links work on WhatsApp, Discord, and Telegram?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Copy the Direct link and paste it into any chat. WhatsApp shows a thumbnail preview, Discord auto-unfurls images, Telegram generates a rich preview card." } },
      { "@type": "Question", "name": "Do you store my images? Is my data private?", "acceptedAnswer": { "@type": "Answer", "text": "Your images are stored on Cloudinary. ImgBazar does not store any images on our own servers, does not track you with cookies, and does not sell or share your data. Your upload history is stored only in your browser's localStorage." } },
      { "@type": "Question", "name": "Can I use ImgBazar for commercial purposes?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. You can upload images for client work, business websites, e-commerce product photos, marketing materials, email newsletters. There are no restrictions on commercial use." } },
      { "@type": "Question", "name": "What happens if I clear my browser data?", "acceptedAnswer": { "@type": "Answer", "text": "Your History list is stored in your browser's localStorage. If you clear browser data or switch device, your History list will be empty, but images remain on Cloudinary and all links you've already shared continue to work." } },
      { "@type": "Question", "name": "Can I use ImgBazar on my phone?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, ImgBazar is fully mobile-responsive. Upload from your phone's camera roll, paste screenshots, and share links via WhatsApp, Instagram, Telegram directly from the browser's share sheet." } },
      { "@type": "Question", "name": "How do I report a bug or request a feature?", "acceptedAnswer": { "@type": "Answer", "text": "ImgBazar is built by the Velora team. You can reach out via the Velora dashboard or email. We read every message and ship improvements weekly." } },
    ]
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ImgBazar",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "1240" },
    "author": { "@type": "Organization", "name": "Velora" },
    "description": "Free image hosting - Upload image, get direct link, markdown, HTML, BBCode, Blogger, WordPress link instantly. No login, unlimited bandwidth."
  };

  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      </head>
      <body style={{ margin: 0, background: "#0A0A14" }}>{children}</body>
    </html>
  );
}
