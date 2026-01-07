
import { User } from '../types';

// This service mimics a backend API that handles OAuth verification
// In a real app, these functions would be fetch calls to your Node.js API

const MOCK_DELAY = 1200;

export const authService = {
  async loginWithGoogle(token: string): Promise<User> {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    // Verify token with Google API would happen here
    
    return {
      id: `google_${Date.now()}`,
      displayName: 'Google Student',
      email: 'student@gmail.com',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google',
      role: 'student',
      learningTrack: 'ES_TO_EN',
      preferredUiLanguage: 'es',
      provider: 'google'
    };
  },

  async loginWithFacebook(token: string): Promise<User> {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    // Verify token with Facebook Graph API would happen here

    return {
      id: `fb_${Date.now()}`,
      displayName: 'Facebook User',
      email: 'user@facebook.com',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FB',
      role: 'student',
      learningTrack: 'EN_TO_ES',
      preferredUiLanguage: 'en',
      provider: 'facebook'
    };
  },

  async loginWithApple(token: string): Promise<User> {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    // Verify token with Apple ID REST API would happen here

    return {
      id: `apple_${Date.now()}`,
      displayName: 'Apple User',
      email: 'user@icloud.com',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Apple',
      role: 'student',
      learningTrack: 'ES_TO_EN',
      preferredUiLanguage: 'es',
      provider: 'apple'
    };
  },

  async logout(): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
    // Invalidate session on backend
  }
};
