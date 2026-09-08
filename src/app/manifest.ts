import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orangeball Dreams",
    short_name: "OBD",
    description:
      "Basketball scouting, athlete representation and performance visibility platform.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#070a10",
    theme_color: "#ff7a18",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
