
/**
 * Audio Manager for Google AI Studio
 * Handles audio playback with proper user interaction handling
 */

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private isInitialized = false;

    /**
     * Initialize audio context (must be called from user interaction)
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const audioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new audioContextClass();
            
            console.log('[AudioManager] ✅ AudioContext initialized');
            
            // Resume if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('[AudioManager] ✅ AudioContext resumed');
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.warn('[AudioManager] ⚠️ AudioContext initialization failed:', error);
        }
    }

    /**
     * Play ambient background sound
     */
    async playAmbientSound(url: string): Promise<void> {
        if (!this.isInitialized) {
            console.warn('[AudioManager] ⚠️ AudioContext not initialized. Call initialize() first.');
            return;
        }

        try {
            // Check if context is suspended and try to resume
            if (this.audioContext?.state === 'suspended') {
                await this.audioContext.resume();
            }

            console.log(`[AudioManager] 🔊 Playing ambient sound: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                // If fetch fails, try HTML5 Audio as fallback
                const audio = new Audio(url);
                audio.loop = true;
                audio.volume = 0.2;
                audio.play().catch(e => console.warn("HTML5 Audio fallback failed", e));
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
            
            const source = this.audioContext!.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;
            
            const gainNode = this.audioContext!.createGain();
            gainNode.gain.value = 0.2; // Low volume for ambient
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);
            source.start(0);
            
            console.log('[AudioManager] ✅ Ambient sound playing');
        } catch (error) {
            console.error('[AudioManager] ❌ Failed to play ambient sound:', error);
        }
    }

    get context() {
        return this.audioContext;
    }
}

// Singleton instance
export const audioManager = new AudioManager();
