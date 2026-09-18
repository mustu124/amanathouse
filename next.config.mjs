const requiredPublicEnvVars = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
  "NEXT_PUBLIC_STORE_EMAIL",
  "NEXT_PUBLIC_INSTAGRAM_URL"
];

const missingEnvVars = requiredPublicEnvVars.filter((name) => !process.env[name]?.trim());

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variable${missingEnvVars.length > 1 ? "s" : ""}: ${missingEnvVars.join(", ")}. ` +
      "Copy .env.local.example to .env.local and fill these in — see docs/ENV_SETUP.md."
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
