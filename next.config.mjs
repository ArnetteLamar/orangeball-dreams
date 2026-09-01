/** @type {import('next').NextConfig} */

const nextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./messages/**/*"],
  },
};

export default nextConfig;
