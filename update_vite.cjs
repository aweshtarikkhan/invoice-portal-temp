const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const rollupOptions = `build: {
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
  },`;

if (!code.includes('manualChunks')) {
  code = code.replace(/plugins:/, rollupOptions + '\n  plugins:');
  fs.writeFileSync('vite.config.ts', code, 'utf8');
  console.log('Updated vite.config.ts');
} else {
  console.log('manualChunks already exists');
}
