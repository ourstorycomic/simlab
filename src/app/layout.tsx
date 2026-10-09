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
        "giáo dục",
        "phòng thí nghiệm ảo",
        "simlab",
        "stem",
        "khoa học",
        "thực hành hóa học",
        "thực hành vật lý",
        "mô hình sinh học",
        "virtual lab",
        "edtech",
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
        title: "Simlab — Nền tảng thực hành khoa học ảo",
        description:
            "Khám phá Hóa học, Vật lý và Sinh học trực quan với các thí nghiệm mô phỏng và mô hình 3D sinh động",
        type: "website",
        locale: "vi_VN",
        siteName: "Simlab",
        url: "https://simlab.vercel.app",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Simlab — Nền tảng thực hành khoa học ảo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Simlab — Nền tảng thực hành khoa học ảo",
        description:
            "Khám phá Hóa học, Vật lý và Sinh học trực quan với các thí nghiệm mô phỏng và mô hình 3D sinh động",
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
                                "Nền tảng thực hành khoa học ảo (Hóa học, Vật lý, Sinh học) trực quan, an toàn và dễ sử dụng",
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
