import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Strong",
    short_name: "Strong",
    description: "Track your workouts and progress. Add to Home Screen for app-like experience.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1b22",
    theme_color: "#1c1b22",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
