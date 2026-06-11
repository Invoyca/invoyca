import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PDF üretimi için font dosyalarının serverless fonksiyona dahil edilmesini garantile
  outputFileTracingIncludes: {
    "/api/invoice-pdf": ["./public/fonts/**/*"],
  },
};
export default nextConfig;
