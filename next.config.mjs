/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: false,
  reactStrictMode: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
