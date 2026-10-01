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
    const errorStr = (error?.toString() || error?.message || "").toLowerCase();
    const isChunkOrScriptError =
      errorStr.includes("dynamically imported module") ||
      errorStr.includes("loading chunk") ||
      errorStr.includes("importing a module script failed") ||
      errorStr.includes("unexpected token '<'") ||
      errorStr.includes("chunkloaderror");

    if (isChunkOrScriptError) {
      const reloadKey = "chunk_error_reload";
      const lastReload = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
      const now = Date.now();
      if (!lastReload || now - lastReload > 8000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const errorStr = (this.state.error?.toString() || this.state.error?.message || "").toLowerCase();
      const isChunkOrScriptError =
        errorStr.includes("dynamically imported module") ||
        errorStr.includes("loading chunk") ||
        errorStr.includes("importing a module script failed") ||
        errorStr.includes("unexpected token '<'") ||
        errorStr.includes("chunkloaderror");

      // For any chunk/network/module loading hiccups, show ONLY a subtle loading spinner while silently reloading
      if (isChunkOrScriptError) {
        return (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                margin: '0 auto 12px'
              }} />
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Loading workspace...</p>
            </div>
          </div>
        );
      }

      // For unexpected runtime component errors, show a clean generic error card (never "App Updated")
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
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              An unexpected error occurred while loading this page.
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
              Refresh Page
            </button>
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
