/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@empradb/schema",
    "@empradb/graph",
    "@empradb/curriculum",
    "@empradb/exams",
    "@empradb/search",
    "@empradb/diagnostics",
    "@empradb/renderer",
  ],
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@empradb/schema"],
  },
};

module.exports = nextConfig;
