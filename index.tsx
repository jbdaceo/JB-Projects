
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('[App] 🚀 Starting...');

// CRITICAL: Detect Google AI Studio environment
const isGoogleAIStudio = () => {
    return (
        window.location.hostname.includes('scf.usercontent.goog') ||
        window.location.hostname.includes('ai.studio') ||
        window.location.href.includes('ai.studio') ||
        window.location.origin.includes('usercontent.goog')
    );
};

const isStudio = isGoogleAIStudio();
console.log(`[App] ${isStudio ? '✅' : '⚠️'} Google AI Studio detected: ${isStudio}`);

// Service Worker registration - ONLY for local/production, NOT Google AI Studio
if (!isStudio) {
    console.log('[App] 📱 Attempting Service Worker registration...');
    
    const registerServiceWorker = () => {
        if (!('serviceWorker' in navigator)) {
            console.log('[App] ℹ️ Service Workers not supported');
            return;
        }

        const isSecure = 
            window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (!isSecure) {
            console.warn('[App] ⚠️ Service Workers require HTTPS or localhost');
            return;
        }

        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register(
                    './service-worker.js',
                    { scope: '/' }
                );
                console.log('[App] ✅ Service Worker registered');
            } catch (error) {
                console.warn(
                    '[App] ⚠️ SW registration failed (non-critical):',
                    error instanceof Error ? error.message : String(error)
                );
            }
        });
    };

    registerServiceWorker();
} else {
    console.log('[App] 🔒 Service Worker disabled (Google AI Studio environment)');
}

// Mount React app
const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('[App] ❌ ERROR: Could not find root element');
    throw new Error("Could not find root element");
}

console.log('[App] 📦 Mounting React application...');

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    console.log('[App] ✅ React application mounted successfully');
} catch (error) {
    console.error('[App] ❌ Render error:', error);
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
            <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
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
