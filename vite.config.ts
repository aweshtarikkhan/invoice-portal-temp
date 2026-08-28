import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge', 'framer-motion', 'sonner'],
          'radix-vendor': [
            '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', 
            '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-popover', 
            '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-tabs', 
            '@radix-ui/react-toast', '@radix-ui/react-tooltip'
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          'excel-vendor': ['exceljs', 'papaparse'],
          'utils-vendor': ['date-fns', 'zod', 'zustand', 'react-hook-form', '@hookform/resolvers'],
          'ai-vendor': ['@google/generative-ai', '@imgly/background-removal']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "@radix-ui/react-tooltip", "react-helmet-async"],
  },
}));
