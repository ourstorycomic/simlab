import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import StoreProvider from "@/components/StoreProvider";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ["latin", "vietnamese"],
    weight: ["300", "400", "500", "600", "700", "800"],
    display: "swap",
    variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://simlab.vercel.app"),
    title: {
        default: "Simlab Edu — Giải pháp Thực hành Kỹ thuật số",
        template: "%s | Simlab Edu",
    },
    description:
        "Nền tảng thực hành khoa học ảo tương tác chuẩn GDPT 2018 — Khám phá Hóa học, Vật lý và Sinh học với mô phỏng trực quan, theo dõi tiến độ và chấm điểm tự động",
    keywords: [
        "hóa học",
        "phòng thí nghiệm ảo",
        "simlab",
        "chemistry lab",
        "virtual lab",
        "phản ứng hóa học",
        "thí nghiệm ảo",
        "chemistry simulation",
        "mô phỏng hóa học",
    ],
    authors: [{ name: "Simlab" }],
    creator: "Simlab",
    publisher: "Simlab",
    applicationName: "Simlab",
    category: "education",
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "48x48" },
            { url: "/icon.svg", type: "image/svg+xml" },
        ],
        apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
    openGraph: {
        title: "Simlab — Phòng thí nghiệm hóa học ảo",
        description:
            "Khám phá phản ứng hóa học với mô phỏng trực quan, kéo thả hóa chất và quan sát hiện tượng",
        type: "website",
        locale: "vi_VN",
        siteName: "Simlab",
        url: "https://simlab.vercel.app",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Simlab — Phòng thí nghiệm hóa học ảo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Simlab — Phòng thí nghiệm hóa học ảo",
        description:
            "Khám phá phản ứng hóa học với mô phỏng trực quan, kéo thả hóa chất và quan sát hiện tượng",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={`dark ${beVietnamPro.variable}`} suppressHydrationWarning>
            <body className="antialiased max-h-screen">
                {/* Apply saved theme before paint to avoid flash */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try{var t=localStorage.getItem("simlab-theme");if(t==="light"){document.documentElement.classList.remove("dark")}}catch(e){}`,
                    }}
                />
                {/* Structured data for search engines */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            name: "Simlab",
                            applicationCategory: "EducationalApplication",
                            operatingSystem: "Any",
                            description:
                                "Phòng thí nghiệm hóa học ảo tương tác — khám phá phản ứng hóa học, kéo thả hóa chất và quan sát hiện tượng",
                            url: "https://simlab.vercel.app",
                            inLanguage: "vi",
                            offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
                        }),
                    }}
                />
                <ToastProvider><StoreProvider>{children}</StoreProvider></ToastProvider>
            </body>
        </html>
    );

}
