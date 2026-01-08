
import { useCallback, useState } from 'react';
import { ttsService } from '../services/ttsService';

export function useTTS() {
    const [isLoading, setIsLoading] = useState(false);
    const [quotaRemaining, setQuotaRemaining] = useState(ttsService.quotaRemaining());

    const speak = useCallback(async (text: string) => {
        setIsLoading(true);
        try {
            const audioUrl = await ttsService.generateSpeech(text);
            
            if (!audioUrl) {
                console.warn('[useTTS] ⚠️ TTS quota exceeded');
                return;
            }

            // Play audio if URL available (and not just the Web Speech marker)
            if (audioUrl && audioUrl !== 'speech-generated' && audioUrl.startsWith('data:')) {
                const audio = new Audio(audioUrl);
                audio.play().catch(e => console.error('[useTTS] ❌ Playback failed:', e));
            }
        } catch (error) {
            console.error('[useTTS] ❌ TTS failed:', error);
        } finally {
            setIsLoading(false);
            setQuotaRemaining(ttsService.quotaRemaining());
        }
    }, []);

    return {
        speak,
        isLoading,
        quotaRemaining,
        quotaExceeded: quotaRemaining === 0,
    };
}
