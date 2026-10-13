import type { NextConfig } from "next";
import { configureDatabaseTarget } from "./scripts/database-target";

configureDatabaseTarget();

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async headers() {
    return [
      {
        source: "/:path*.jfif",
        headers: [
          {
            key: "Content-Type",
            value: "image/jpeg",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
