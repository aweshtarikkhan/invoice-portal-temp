import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { cleanupStaleServiceWorkers, setupWebAppManifest } from "./lib/service-worker-cleanup";

cleanupStaleServiceWorkers();
setupWebAppManifest();

// Auto-reload once when a chunk fails to load due to a new deployment / updated build
window.addEventListener("vite:preloadError", (event) => {
  console.warn("Vite chunk preload error detected, reloading page...", event);
  const reloadKey = "chunk_preload_reload";
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(reloadKey, now.toString());
    window.location.reload();
  }
});

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any) {
    const errorStr = error?.toString() || error?.message || "";
    const isChunkError =
      errorStr.includes("dynamically imported module") ||
      errorStr.includes("Failed to fetch dynamically imported module") ||
      errorStr.includes("Loading chunk") ||
      errorStr.includes("Importing a module script failed");

    if (isChunkError) {
      const reloadKey = "chunk_error_reload";
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const errorStr = this.state.error?.toString() || this.state.error?.message || "";
      const isChunkError =
        errorStr.includes("dynamically imported module") ||
        errorStr.includes("Failed to fetch dynamically imported module");

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#1e293b'
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isChunkError ? '#eff6ff' : '#fef2f2',
              color: isChunkError ? '#2563eb' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px'
            }}>
              {isChunkError ? '🔄' : '⚠️'}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
              {isChunkError ? 'App Updated' : 'Something went wrong'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              {isChunkError
                ? 'A new version of the app has been published. Please reload the page to load the latest updates.'
                : 'An unexpected error occurred while loading this page.'}
            </p>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
            >
              Reload Page
            </button>
            {!isChunkError && (
              <pre style={{
                marginTop: '20px',
                padding: '12px',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '11px',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '160px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </HelmetProvider>
);
