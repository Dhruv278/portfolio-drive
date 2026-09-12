// The one place the site's public address lives. Metadata, the sitemap, the assistant's origin check
// and the links inside the assistant's record all read it from here.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portfolio-drive-mu.vercel.app'
