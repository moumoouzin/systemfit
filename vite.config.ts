import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/whmvgdhodoybcixjaodm\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'SystemFit - Seu Personal Trainer',
        short_name: 'SystemFit',
        description: 'Aplicativo completo para gerenciar seus treinos e acompanhar seu progresso fitness',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        id: 'systemfit-pwa',
        categories: ['health', 'fitness', 'sports'],
        lang: 'pt-BR',
        dir: 'ltr',
        prefer_related_applications: false,
        icons: [
          {
            src: 'favicon.ico',
            sizes: '16x16 32x32 48x48',
            type: 'image/x-icon',
          },
          {
            src: 'favicon.ico',
            sizes: '192x192',
            type: 'image/x-icon',
            purpose: 'any',
          },
          {
            src: 'favicon.ico',
            sizes: '512x512',
            type: 'image/x-icon',
            purpose: 'any',
          },
          {
            src: 'favicon.ico',
            sizes: '512x512',
            type: 'image/x-icon',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Novo Treino',
            short_name: 'Novo Treino',
            description: 'Criar um novo treino',
            url: '/workouts/new',
            icons: [{ src: 'favicon.ico', sizes: '192x192' }]
          },
          {
            name: 'Histórico',
            short_name: 'Histórico',
            description: 'Ver histórico de treinos',
            url: '/history',
            icons: [{ src: 'favicon.ico', sizes: '192x192' }]
          }
        ]
      },
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
