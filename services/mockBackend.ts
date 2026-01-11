
import { User, RoomState, GameState, ChatMsg } from '../types';
import { getPersonaResponse, getGameHint } from './gemini';

type Listener = (data: any) => void;

class MockSocketService {
  private listeners: Record<string, Listener[]> = {};
  private rooms: Record<string, RoomState> = {};
  private chatHistories: Record<string, ChatMsg[]> = {}; // Isolated by channelId
  private matchmakingQueue: { userId: string, track: 'EN_TO_ES' | 'ES_TO_EN' }[] = [];

  constructor() {
    // Seed global chat history
    this.chatHistories['global'] = [
      { id: '1', userId: 'ai_tomas', user: 'Profe Tomas', state: 'AI', text: '¡Hola a todos! Welcome to the global chat.', time: '10:00', isUser: false, type: 'ai', channelId: 'global' },
      // Removed learningTrack as it is not part of ChatMsg interface to fix type error
      { id: '2', userId: 'u1', user: 'Maria', state: 'CO', text: 'Hello! I am ready to learn.', time: '10:05', isUser: false, type: 'human', channelId: 'global' }
    ];
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  emit(event: string, data: any) {
    if (event.startsWith('server:')) {
      this.handleServerEvent(event, data);
    } else {
      this.broadcast(event, data);
    }
  }

  private broadcast(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  private async handleServerEvent(event: string, data: any) {
    switch (event) {
      case 'server:chat:join':
        const channelId = data.channelId || 'global';
        this.broadcast(`chat:history:${channelId}`, this.chatHistories[channelId] || []);
        break;

      case 'server:chat:message':
        const msg = data as ChatMsg;
        const targetChannel = msg.channelId || 'global';
        if (!this.chatHistories[targetChannel]) this.chatHistories[targetChannel] = [];
        this.chatHistories[targetChannel].push(msg);
        this.broadcast(`chat:message:${targetChannel}`, msg);
        
        if (msg.text.includes('@Tomas') || msg.text.includes('@Carolina')) {
          const persona = msg.text.includes('@Tomas') ? 'tomas' : 'carolina';
          const responseText = await getPersonaResponse(persona, msg.text);
          
          const aiMsg: ChatMsg = {
            id: Date.now().toString(),
            userId: `ai_${persona}`,
            user: persona === 'tomas' ? 'Profe Tomas' : 'Carolina',
            state: 'AI',
            text: responseText,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            isUser: false,
            type: 'ai',
            channelId: targetChannel
          };
          
          this.chatHistories[targetChannel].push(aiMsg);
          this.broadcast(`chat:message:${targetChannel}`, aiMsg);
        }
        break;

      case 'server:room:join':
        this.handleRoomJoin(data.roomId, data.user);
        break;

      case 'server:game:submit_answer':
        this.handleGameAnswer(data.roomId, data.userId, data.answer);
        break;

      case 'server:game:ask_help':
        this.handleGameHelp(data.roomId);
        break;
      
      case 'server:game:peer_help':
        this.handlePeerHelp(data.roomId, data.userId);
        break;
        
      case 'server:matchmaking:find':
        this.handleMatchmaking(data.user);
        break;
    }
  }

  private handleMatchmaking(user: User) {
      const oppositeTrack = user.learningTrack === 'EN_TO_ES' ? 'ES_TO_EN' : 'EN_TO_ES';
      const matchIndex = this.matchmakingQueue.findIndex(q => q.track === oppositeTrack);
      
      if (matchIndex !== -1) {
          const match = this.matchmakingQueue.splice(matchIndex, 1)[0];
          const roomId = `room_match_${Date.now()}`;
          this.broadcast(`matchmaking:found:${user.id}`, { roomId });
          this.broadcast(`matchmaking:found:${match.userId}`, { roomId });
      } else {
          this.matchmakingQueue.push({ userId: user.id, track: user.learningTrack });
          setTimeout(() => {
             const idx = this.matchmakingQueue.findIndex(q => q.userId === user.id);
             if (idx !== -1) {
                 this.matchmakingQueue.splice(idx, 1);
                 const roomId = `room_mock_${Date.now()}`;
                 this.broadcast(`matchmaking:found:${user.id}`, { roomId });
             }
          }, 3000);
      }
  }

  private handleRoomJoin(roomId: string, user: User) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        id: roomId,
        roomId,
        participants: [],
        currentLevel: 1,
        roundNumber: 1,
        helpUsedThisCycle: false,
        gameState: this.generateLevelData(1)
      };
    }
    
    const room = this.rooms[roomId];
    if (room.participants && !room.participants.find(p => p.id === user.id)) {
      room.participants.push(user);
    }
    
    this.broadcast(`room:${roomId}:update`, room);
  }

  private handleGameAnswer(roomId: string, userId: string, answer: string) {
    const room = this.rooms[roomId];
    if (!room || !room.gameState) return;

    room.gameState.submittedAnswers[userId] = answer;
    const participant = room.participants?.find(p => p.id === userId);
    if (!participant) return;

    const targetWord = participant.learningTrack === 'EN_TO_ES' 
      ? room.gameState.missingWordEs 
      : room.gameState.missingWordEn;

    if (answer.toLowerCase().trim() === targetWord.toLowerCase().trim()) {
       room.gameState.feedback = "Correct! +XP";
       setTimeout(() => this.advanceLevel(room), 1000);
    } else {
       room.gameState.feedback = "Try again!";
       this.broadcast(`room:${roomId}:update`, room);
    }
  }

  private advanceLevel(room: RoomState) {
    if (room.currentLevel !== undefined) room.currentLevel++;
    if (room.roundNumber !== undefined) room.roundNumber++;
    if (room.roundNumber !== undefined && room.roundNumber % 2 !== 0) room.helpUsedThisCycle = false;
    
    if (room.currentLevel !== undefined) {
      room.gameState = this.generateLevelData(room.currentLevel);
    }
    if (room.gameState) room.gameState.feedback = "";
    this.broadcast(`room:${room.roomId}:update`, room);
    this.broadcast(`game:${room.roomId}:success`, { level: room.currentLevel });
  }

  private async handleGameHelp(roomId: string) {
    const room = this.rooms[roomId];
    if (!room || room.roundNumber === undefined || room.gameState === undefined) return;
    
    if (room.roundNumber % 2 === 0 && !room.helpUsedThisCycle) {
      room.helpUsedThisCycle = true;
      const hint = await getGameHint(room.gameState);
      this.broadcast(`game:${roomId}:help`, { hint });
      this.broadcast(`room:${roomId}:update`, room);
    }
  }
  
  private handlePeerHelp(roomId: string, userId: string) {
      const room = this.rooms[roomId];
      if (!room || room.helpUsedThisCycle || !room.gameState || !room.participants) return;
      
      room.helpUsedThisCycle = true;
      const user = room.participants.find(p => p.id === userId);
      const targetWord = user?.learningTrack === 'EN_TO_ES' ? room.gameState.missingWordEs : room.gameState.missingWordEn;
      
      this.broadcast(`game:${roomId}:help`, { hint: `Partner says: It starts with ${targetWord.charAt(0)}...` });
      this.broadcast(`room:${roomId}:update`, room);
  }

  private generateLevelData(level: number): GameState {
    const nouns = ["cat", "dog", "house", "car", "book", "computer", "phone", "idea", "dream", "goal"];
    const esNouns = ["gato", "perro", "casa", "carro", "libro", "computador", "teléfono", "idea", "sueño", "meta"];
    const adjectives = ["big", "small", "happy", "sad", "fast", "slow", "good", "bad", "new", "old"];
    const esAdjectives = ["grande", "pequeño", "feliz", "triste", "rápido", "lento", "bueno", "malo", "nuevo", "viejo"];

    const baseVocab = [
      { en: "cat", es: "gato", sEn: "The ___ sleeps.", sEs: "El ___ duerme." },
      { en: "house", es: "casa", sEn: "My ___ is big.", sEs: "Mi ___ es grande." },
      { en: "water", es: "agua", sEn: "I drink ___.", sEs: "Yo bebo ___." },
    ];
    
    let item;
    if (level <= baseVocab.length) {
        item = baseVocab[level - 1];
    } else {
        const typeIndex = Math.floor(level / 10) % 3;
        const wordIndex = level % 10;
        
        if (typeIndex === 0) {
            item = {
                en: nouns[wordIndex], es: esNouns[wordIndex],
                sEn: `The ${adjectives[wordIndex]} ___ is here.`,
                sEs: `El ___ ${esAdjectives[wordIndex]} está aquí.`
            };
        } else if (typeIndex === 1) {
            item = {
                en: "run", es: "correr",
                sEn: `I like to ___.`,
                sEs: `Me gusta ___.`
            };
        } else {
            item = {
                en: adjectives[wordIndex], es: esAdjectives[wordIndex],
                sEn: `The house is ___.`,
                sEs: `La casa es ___.`
            };
        }
    }
    
    return {
      sentenceEn: item.sEn.replace('___', '____'),
      sentenceEs: item.sEs.replace('___', '____'),
      missingWordEn: item.en, 
      missingWordEs: item.es, 
      submittedAnswers: {}
    };
  }
}

export const socket = new MockSocketService();
