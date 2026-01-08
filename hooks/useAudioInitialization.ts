
import { useEffect } from 'react';
import { audioManager } from '../utils/audioManager';

/**
 * Hook to initialize audio on first user interaction
 */
export function useAudioInitialization() {
    useEffect(() => {
        const initializeAudio = async () => {
            try {
                await audioManager.initialize();
                console.log('[useAudioInitialization] ✅ Audio initialized');
            } catch (error) {
                console.warn('[useAudioInitialization] ⚠️ Audio init failed:', error);
            }
        };

        // Initialize on any user interaction
        const events = ['click', 'touchstart', 'keydown'];
        
        const handleInteraction = () => {
            console.log('[useAudioInitialization] 👆 User interaction detected');
            initializeAudio();
            
            // Remove listeners after initialization
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };

        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { once: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, []);
}
