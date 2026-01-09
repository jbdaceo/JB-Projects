
import { User, RoomState, GameState, ChatMsg, Invite } from '../types';
import { getPersonaResponse, getGameHint } from './gemini';

// --- Mock Socket System (Event Emitter) ---
type Listener = (data: any) => void;

class MockSocketService {
  private listeners: Record<string, Listener[]> = {};
  private rooms: Record<string, RoomState> = {};
  private chatHistory: ChatMsg[] = [];
  private matchmakingQueue: { userId: string, track: 'EN_TO_ES' | 'ES_TO_EN' }[] = [];

  constructor() {
    // Seed chat history
    this.chatHistory = [
      { id: '1', userId: 'ai_tomas', user: 'Profe Tomas', state: 'AI', text: '¡Hola a todos! Welcome to the global chat.', time: '10:00', isUser: false, type: 'ai' },
      // Fix Error: ChatMsg now includes optional learningTrack property
      { id: '2', userId: 'u1', user: 'Maria', state: 'CO', text: 'Hello! I am ready to learn.', time: '10:05', isUser: false, type: 'human', learningTrack: 'ES_TO_EN' }
    ];
  }

  // --- Client Side Methods ---
  
  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  emit(event: string, data: any) {
    // Determine if this is a server-bound event (mocking network)
    if (event.startsWith('server:')) {
      this.handleServerEvent(event, data);
    } else {
      // Local broadcast (not used much in this pattern)
      this.broadcast(event, data);
    }
  }

  // --- Server Logic Simulation ---

  private broadcast(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  private async handleServerEvent(event: string, data: any) {
    // Artificial Delay
    // await new Promise(r => setTimeout(r, 100));

    switch (event) {
      case 'server:chat:join':
        this.broadcast('chat:history', this.chatHistory);
        break;

      case 'server:chat:message':
        const msg = data as ChatMsg;
        this.chatHistory.push(msg);
        this.broadcast('chat:message', msg);
        
        // AI Trigger
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
            type: 'ai'
          };
          
          this.chatHistory.push(aiMsg);
          this.broadcast('chat:message', aiMsg);
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
        
      case 'server:classroom:join':
        this.broadcast(`classroom:${data.roomId}:status`, { message: `${data.user.displayName} joined` });
        break;
      
      case 'server:classroom:message':
        this.broadcast(`classroom:${data.roomId}:message`, data);
        break;

      case 'server:invite:send':
        const invite = data as Invite;
        this.broadcast(`invite:received:${invite.toUserId}`, invite);
        break;

      case 'server:invite:accept':
        this.broadcast(`invite:accepted:${data.roomId}`, { roomId: data.roomId });
        break;
        
      case 'server:matchmaking:find':
        this.handleMatchmaking(data.user);
        break;
    }
  }

  private handleMatchmaking(user: User) {
      // Logic: Find someone with OPPOSITE learning track
      const oppositeTrack = user.learningTrack === 'EN_TO_ES' ? 'ES_TO_EN' : 'EN_TO_ES';
      const matchIndex = this.matchmakingQueue.findIndex(q => q.track === oppositeTrack);
      
      if (matchIndex !== -1) {
          // Found match
          const match = this.matchmakingQueue.splice(matchIndex, 1)[0];
          const roomId = `room_match_${Date.now()}`;
          
          // Notify both (Mock: broadcast to user IDs)
          this.broadcast(`matchmaking:found:${user.id}`, { roomId });
          this.broadcast(`matchmaking:found:${match.userId}`, { roomId });
      } else {
          // Add to queue
          this.matchmakingQueue.push({ userId: user.id, track: user.learningTrack });
          // Auto-match mock after 3 seconds for demo
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
      // Fix Error: Updated object literal to match RoomState interface with required 'id'
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

    // Logic:
    // If learning EN_TO_ES -> They are filling the Spanish Blank (missingWordEs)
    // If learning ES_TO_EN -> They are filling the English Blank (missingWordEn)
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
    if (room.gameState) room.gameState.feedback = ""; // clear feedback
    this.broadcast(`room:${room.roomId}:update`, room);
    this.broadcast(`game:${room.roomId}:success`, { level: room.currentLevel });
  }

  private async handleGameHelp(roomId: string) {
    const room = this.rooms[roomId];
    if (!room || room.roundNumber === undefined || room.gameState === undefined) return;
    
    // Help Rule: Every 2 rounds
    if (room.roundNumber % 2 === 0 && !room.helpUsedThisCycle) {
      room.helpUsedThisCycle = true;
      const hint = await getGameHint(room.gameState);
      this.broadcast(`game:${roomId}:help`, { hint });
      this.broadcast(`room:${roomId}:update`, room);
    }
  }
  
  private handlePeerHelp(roomId: string, userId: string) {
      // In a real app, this would notify the other user to help.
      // Here we simulate it by showing the answer as a "hint from partner"
      const room = this.rooms[roomId];
      if (!room || room.helpUsedThisCycle || !room.gameState || !room.participants) return;
      
      room.helpUsedThisCycle = true;
      const user = room.participants.find(p => p.id === userId);
      const targetWord = user?.learningTrack === 'EN_TO_ES' ? room.gameState.missingWordEs : room.gameState.missingWordEn;
      
      this.broadcast(`game:${roomId}:help`, { hint: `Partner says: It starts with ${targetWord.charAt(0)}...` });
      this.broadcast(`room:${roomId}:update`, room);
  }

  private generateLevelData(level: number): GameState {
    // Extensive vocab pool simulating 300+ levels via rotation and difficulty
    const nouns = ["cat", "dog", "house", "car", "book", "computer", "phone", "idea", "dream", "goal"];
    const verbs = ["run", "eat", "sleep", "think", "create", "build", "learn", "speak", "listen", "write"];
    const adjectives = ["big", "small", "happy", "sad", "fast", "slow", "good", "bad", "new", "old"];
    
    const esNouns = ["gato", "perro", "casa", "carro", "libro", "computador", "teléfono", "idea", "sueño", "meta"];
    const esVerbs = ["correr", "comer", "dormir", "pensar", "crear", "construir", "aprender", "hablar", "escuchar", "escribir"];
    const esAdjectives = ["grande", "pequeño", "feliz", "triste", "rápido", "lento", "bueno", "malo", "nuevo", "viejo"];

    // Base Pool (First 30)
    const baseVocab = [
      { en: "cat", es: "gato", sEn: "The ___ sleeps.", sEs: "El ___ duerme." },
      { en: "house", es: "casa", sEn: "My ___ is big.", sEs: "Mi ___ es grande." },
      { en: "water", es: "agua", sEn: "I drink ___.", sEs: "Yo bebo ___." },
      { en: "freedom", es: "libertad", sEn: "Fight for ___.", sEs: "Lucha por la ___." },
      { en: "success", es: "éxito", sEn: "Hard work brings ___.", sEs: "El trabajo duro trae ___." },
      // ... Add algorithm to generate more
    ];
    
    // Algorithmic Generation for infinite levels
    let item;
    if (level <= baseVocab.length) {
        item = baseVocab[level - 1];
    } else {
        // Procedurally generate simple sentences for levels > base
        const typeIndex = Math.floor(level / 10) % 3; // Rotate Noun/Verb/Adj
        const wordIndex = level % 10;
        
        if (typeIndex === 0) { // Noun
            item = {
                en: nouns[wordIndex], es: esNouns[wordIndex],
                sEn: `The ${adjectives[wordIndex]} ___ is here.`,
                sEs: `El ___ ${esAdjectives[wordIndex]} está aquí.`
            };
        } else if (typeIndex === 1) { // Verb
            item = {
                en: verbs[wordIndex], es: esVerbs[wordIndex],
                sEn: `I like to ___.`,
                sEs: `Me gusta ___.`
            };
        } else { // Adj
            item = {
                en: adjectives[wordIndex], es: esAdjectives[wordIndex],
                sEn: `The house is ___.`,
                sEs: `La casa es ___.`
            };
        }
    }
    
    return {
      sentenceEn: item.sEn.replace('___', '____'), // Context for learning EN
      sentenceEs: item.sEs.replace('___', '____'), // Context for learning ES
      missingWordEn: item.en, 
      missingWordEs: item.es, 
      submittedAnswers: {}
    };
  }
}

export const socket = new MockSocketService();
