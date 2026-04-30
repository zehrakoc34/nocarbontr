import type { Config } from "tailwindcss";

// Tailwind v4: Tüm tema tokenları globals.css içindeki @theme bloğunda tanımlı.
// Bu dosya yalnızca içerik tarama yollarını belirtmek için tutulmaktadır.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
