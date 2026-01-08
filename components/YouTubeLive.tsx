
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface YouTubeLiveProps {
    channelId?: string;      // YouTube Channel ID
    videoId?: string;        // Specific Video ID
    title?: string;          // Display title
    autoplay?: boolean;      // Autoplay on load
    muted?: boolean;         // Mute for autoplay
    fullscreen?: boolean;    // Start fullscreen
    className?: string;      // CSS classes
}

/**
 * YouTube Live Feed Component for TV Display
 * 
 * SOURCES:
 * - YouTube Embed API: https://developers.google.com/youtube/iframe_api_reference
 * - iframe API Params: https://developers.google.com/youtube/player_parameters
 */
export const YouTubeLive: React.FC<YouTubeLiveProps> = ({
    channelId, 
    videoId,
    title = 'Live Stream',
    autoplay = true,
    muted = true,
    fullscreen = false,
    className = ''
}) => {
    const [iframeUrl, setIframeUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState<boolean | null>(null);

    useEffect(() => {
        // ====================================================================
        // BUILD YOUTUBE EMBED URL WITH AUTOPLAY PARAMETERS
        // ====================================================================
        
        let embedUrl = '';
        let params: Record<string, string | number> = {
            // AUTOPLAY & INTERACTION
            'autoplay': autoplay ? '1' : '0',
            'mute': muted ? '1' : '0',
            
            // PLAYER CONTROLS
            'controls': '1',           // Show player controls
            'fs': fullscreen ? '1' : '0',  // Fullscreen button
            'modestbranding': '1',     // Minimal YouTube branding
            'rel': '0',                // Don't show related videos
            'playsinline': '1',        // Play inline (mobile)
            
            // QUALITY & PERFORMANCE
            'iv_load_policy': '3',     // Hide video annotations
            'showinfo': '0',           // Hide video title
            
            // TV/DISPLAY OPTIMIZATIONS
            'disablekb': '0',          // Enable keyboard controls
            'vq': 'hd1080',            // Request HD quality
        };

        // Convert params to query string
        const paramString = Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        if (videoId) {
            // EMBED SPECIFIC VIDEO
            embedUrl = `https://www.youtube.com/embed/${videoId}?${paramString}`;
            console.log(`[YouTubeLive] 📺 Loading video: ${videoId}`);
        } else if (channelId) {
            // EMBED LIVE STREAM FROM CHANNEL
            embedUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}&${paramString}`;
            console.log(`[YouTubeLive] 📺 Loading channel live stream: ${channelId}`);
            setIsLive(true);
        }

        if (embedUrl) {
            setIframeUrl(embedUrl);
            console.log(`[YouTubeLive] 🔗 Embed URL: ${embedUrl}`);
        } else {
            setError('No video or channel specified');
        }

        setIsLoading(false);
    }, [videoId, channelId, autoplay, muted, fullscreen]);

    // ========================================================================
    // ERROR STATE
    // ========================================================================
    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`w-full h-full bg-slate-900 rounded-lg flex items-center justify-center ${className}`}
            >
                <div className="text-center p-6">
                    <p className="text-red-400 text-xl font-bold mb-2">
                        ❌ Failed to Load YouTube
                    </p>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                        Reload Page
                    </button>
                </div>
            </motion.div>
        );
    }

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`w-full h-full bg-slate-900 rounded-lg flex items-center justify-center ${className}`}
            >
                <div className="text-center">
                    <div className="animate-spin text-5xl mb-4">📺</div>
                    <p className="text-slate-300 text-lg">Loading YouTube Feed...</p>
                    <p className="text-slate-500 text-sm mt-2">
                        {isLive === true ? '🔴 Live Stream' : videoId ? '📹 Video' : 'Connecting...'}
                    </p>
                </div>
            </motion.div>
        );
    }

    // ========================================================================
    // RENDER YOUTUBE IFRAME
    // ========================================================================
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full rounded-lg overflow-hidden bg-black shadow-2xl ${className}`}
        >
            {/* Title Overlay (Optional) */}
            {title && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10 pointer-events-none">
                    <h2 className="text-white font-bold text-xl">
                        {isLive === true && <span className="text-red-500 mr-2">🔴 LIVE</span>}
                        {title}
                    </h2>
                </div>
            )}

            {/* YouTube Iframe */}
            <iframe
                width="100%"
                height="100%"
                src={iframeUrl}
                frameBorder="0"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="
                    accelerometer; 
                    autoplay; 
                    clipboard-write; 
                    encrypted-media; 
                    gyroscope; 
                    picture-in-picture; 
                    web-share;
                    fullscreen
                "
                allowFullScreen
                title={title}
                onLoad={() => {
                    console.log('[YouTubeLive] ✅ iframe loaded');
                }}
                onError={() => {
                    console.error('[YouTubeLive] ❌ iframe load error');
                    setError('YouTube iframe failed to load');
                }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                }}
            />
        </motion.div>
    );
};

export default YouTubeLive;
