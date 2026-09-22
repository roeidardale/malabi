import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e suite runs its own dev server beside the normal one; a separate
  // build dir keeps the two from sharing (and locking) `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Dev-only: lets other Tailscale devices (iPhone, laptops) load the dev
  // server. Without this Next 403s their /_next/* requests, so pages render
  // but never hydrate. Hostnames only — no scheme or port.
  allowedDevOrigins: ["omarchy", "*.taild8a38f.ts.net", "100.69.79.32"],
  async redirects() {
    return [
      // The cart used to live at the literal Hebrew path /סל-קניות, which
      // Turbopack routed unreliably. Keep old links and bookmarks working.
      // The source must be percent-encoded: a literal Hebrew source never matches.
      { source: "/%D7%A1%D7%9C-%D7%A7%D7%A0%D7%99%D7%95%D7%AA", destination: "/cart", permanent: true },
      // Customer accounts switched from email/password to phone+OTP; the
      // separate /register step went away, /login now handles both.
      { source: "/register", destination: "/login", permanent: true },
    ];
  },
};

export default nextConfig;
