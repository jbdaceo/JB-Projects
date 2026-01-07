
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('[App] Starting...');

// Service Worker Logic
// We explicitly disable it for Google AI Studio Preview to avoid "Failed to load" errors caused by origin mismatch
const registerServiceWorker = () => {
  // Check specifically if we are in a preview environment.
  // Google AI Studio previews often run on *.usercontent.goog or *.googleusercontent.com
  const hostname = window.location.hostname;
  const isPreview = hostname.includes('googleusercontent.com') || 
                    hostname.includes('usercontent.goog') || 
                    hostname.includes('web.app') ||
                    hostname.includes('ai.studio');
  
  if (isPreview) {
    console.log('[App] Service Worker disabled for Preview Environment (' + hostname + ')');
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: '/' });
        console.log('[App] ✅ Service Worker registered');
      } catch (error) {
        console.warn('[App] SW Registration failed (non-critical):', error);
      }
    });
  }
};

registerServiceWorker();

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('[App] ERROR: Could not find root element');
    document.body.innerHTML = '<h1>Error: No root element found</h1>';
    throw new Error("Could not find root element");
}

console.log('[App] Creating React root...');

try {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    
    console.log('[App] ✅ App rendered successfully');
} catch (error) {
    console.error('[App] ❌ Render error:', error);
    // Fallback UI if React crashes immediately
    document.body.innerHTML = `
        <div style="
            padding: 20px;
            background: #020617;
            color: #f1f5f9;
            font-family: sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        ">
            <h1 style="color: #ef4444;">Failed to Load App</h1>
            <p>Please check the console for details.</p>
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 20px;
            ">Reload</button>
        </div>
    `;
}
