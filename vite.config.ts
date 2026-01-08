import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
            strictPort: false,
            cors: {
                origin: '*',
                credentials: true,
                methods: ['GET', 'POST', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization']
            },
            proxy: {
                '/api/youtube': {
                    target: 'https://www.googleapis.com/youtube/v3',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/youtube/, ''),
                },
                '/api/tts': {
                    target: 'https://texttospeech.googleapis.com/v1',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/tts/, ''),
                }
            }
        },
        plugins: [react()],
        define: {
            'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
            'process.env.VITE_YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY),
            'process.env.VITE_ENABLE_AMBIENT_AUDIO': JSON.stringify(env.VITE_ENABLE_AMBIENT_AUDIO === 'true'),
            'process.env.VITE_TTS_QUOTA_LIMIT': JSON.stringify(parseInt(env.VITE_TTS_QUOTA_LIMIT || '50')),
            'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || '')
        },
        resolve: {
            alias: {
                '@': path.resolve('.'),
            }
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            minify: 'terser',
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom'],
                        'vendor-anim': ['framer-motion', 'lottie-react', 'canvas-confetti'],
                        'vendor-ai': ['@google/genai'],
                        'vendor-icons': ['lucide-react']
                    }
                }
            }
        }
    };
});