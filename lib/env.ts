const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const storeEmail = process.env.NEXT_PUBLIC_STORE_EMAIL;
const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

function assertPresent(name: string, value: string | undefined): asserts value is string {
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.local.example to .env.local and fill it in — see docs/ENV_SETUP.md.`
    );
  }
}

assertPresent("NEXT_PUBLIC_SITE_URL", siteUrl);
assertPresent("NEXT_PUBLIC_WHATSAPP_NUMBER", whatsappNumber);
assertPresent("NEXT_PUBLIC_STORE_EMAIL", storeEmail);
assertPresent("NEXT_PUBLIC_INSTAGRAM_URL", instagramUrl);

// Starting value for the community group; the admin can change it in Site Settings.
export const DEFAULT_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/GZCNtZyUkDA4YRaHlgUzFq";

export const env = {
  siteUrl,
  whatsappNumber,
  storeEmail,
  instagramUrl
} as const;
