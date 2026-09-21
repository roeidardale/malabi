import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The cart used to live at the literal Hebrew path /סל-קניות, which
      // Turbopack routed unreliably. Keep old links and bookmarks working.
      // The source must be percent-encoded: a literal Hebrew source never matches.
      { source: "/%D7%A1%D7%9C-%D7%A7%D7%A0%D7%99%D7%95%D7%AA", destination: "/cart", permanent: true },
    ];
  },
};

export default nextConfig;
