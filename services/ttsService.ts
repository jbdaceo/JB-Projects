
/**
 * Text-to-Speech Service with Quota Management
 */

interface TTSCache {
    [key: string]: {
        audioUrl: string;
        timestamp: number;
    };
}

export class TTSService {
    private cache: TTSCache = {};
    private quotaLimit = 50; // Requests per day
    private quotaUsed = 0;
    private lastResetTime = Date.now();
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    private readonly QUOTA_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    constructor() {
        this.loadCacheFromStorage();
    }

    /**
     * Generate speech from text
     */
    async generateSpeech(text: string, options = { language: 'en-US', rate: 1.0 }): Promise<string | null> {
        try {
            // Check quota
            if (!this.hasQuotaRemaining()) {
                console.warn('[TTSService] ⚠️ TTS quota exceeded for today');
                return null;
            }

            // Check cache
            const cacheKey = `${text}|${options.language}|${options.rate}`;
            if (this.cache[cacheKey]) {
                console.log('[TTSService] ✅ Using cached audio');
                return this.cache[cacheKey].audioUrl;
            }

            // Generate using Web Speech API (free, no quota)
            const audioUrl = await this.generateWithWebSpeechAPI(text, options);
            
            if (audioUrl) {
                // Cache the result
                this.cache[cacheKey] = {
                    audioUrl,
                    timestamp: Date.now()
                };
                this.saveCacheToStorage();
                this.quotaUsed++;
                
                return audioUrl;
            }

            return null;
        } catch (error) {
            console.error('[TTSService] ❌ TTS generation failed:', error);
            return null;
        }
    }

    /**
     * Generate speech using Web Speech API (free, built-in)
     */
    private async generateWithWebSpeechAPI(text: string, options: any): Promise<string | null> {
        return new Promise((resolve) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = options.language;
                utterance.rate = options.rate;

                // For simplicity, use the browser's built-in TTS
                window.speechSynthesis.speak(utterance);

                // Return success (Web Speech API doesn't provide audio URL directly, so we return a marker)
                resolve('speech-generated');
            } catch (error) {
                console.error('[TTSService] ❌ Web Speech API failed:', error);
                resolve(null);
            }
        });
    }

    /**
     * Check if quota remaining
     */
    private hasQuotaRemaining(): boolean {
        this.resetQuotaIfNeeded();
        return this.quotaUsed < this.quotaLimit;
    }

    /**
     * Get remaining quota
     */
    quotaRemaining(): number {
        this.resetQuotaIfNeeded();
        return Math.max(0, this.quotaLimit - this.quotaUsed);
    }

    /**
     * Reset quota if 24 hours have passed
     */
    private resetQuotaIfNeeded(): void {
        const now = Date.now();
        if (now - this.lastResetTime > this.QUOTA_RESET_INTERVAL) {
            this.quotaUsed = 0;
            this.lastResetTime = now;
            this.saveCacheToStorage();
        }
    }

    /**
     * Clear expired cache entries
     */
    private clearExpiredCache(): void {
        const now = Date.now();
        Object.keys(this.cache).forEach(key => {
            if (now - this.cache[key].timestamp > this.CACHE_DURATION) {
                delete this.cache[key];
            }
        });
    }

    /**
     * Save cache to localStorage
     */
    private saveCacheToStorage(): void {
        try {
            this.clearExpiredCache();
            const data = {
                cache: this.cache,
                quotaUsed: this.quotaUsed,
                lastResetTime: this.lastResetTime,
            };
            localStorage.setItem('tts-cache', JSON.stringify(data));
        } catch (error) {
            console.warn('[TTSService] ⚠️ Failed to save cache:', error);
        }
    }

    /**
     * Load cache from localStorage
     */
    private loadCacheFromStorage(): void {
        try {
            const data = localStorage.getItem('tts-cache');
            if (data) {
                const parsed = JSON.parse(data);
                this.cache = parsed.cache || {};
                this.quotaUsed = parsed.quotaUsed || 0;
                this.lastResetTime = parsed.lastResetTime || Date.now();
            }
        } catch (error) {
            console.warn('[TTSService] ⚠️ Failed to load cache:', error);
        }
    }
}

export const ttsService = new TTSService();
