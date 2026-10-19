import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kenzim",
    short_name: "Kenzim",
    description: "The Kenyan community's home in Zimbabwe.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FA",
    theme_color: "#F8F9FA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
