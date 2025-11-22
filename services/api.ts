
import { ExchangeStatus, ItemCondition } from '../types.ts';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';

// --- Constants & Config ---
const BAD_WORDS = ['estafa', 'robo', 'arma', 'droga', 'idiota', 'estupida', 'imbecil', 'bizum', 'whatsapp', 'fuera de la app', 'matar', 'muerte', 'sexo', 'desnudo'];
const MAX_ACCOUNTS_PER_PHONE = 3;

// --- Default Avatars ---
const DEFAULT_AVATAR_NEUTRAL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0UwRTAxMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
const DEFAULT_AVATAR_MALE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0JCREVGQiI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
const DEFAULT_AVATAR_FEMALE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0Y4QkJETCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';


// --- Helper function to generate placeholder images ---
const generatePlaceholderImage = (text: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }

    canvas.width = 500;
    canvas.height = 500;

    const bgColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = text.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = 450;
    
    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    const lineHeight = 35;
    const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), canvas.width / 2, startY + i * lineHeight);
    }
    
    return canvas.toDataURL('image/png');
};

// --- Auto-Moderation Helper ---
const checkContentSafety = (text: string) => {
    if (!text) return { safe: true };
    const lowerText = text.toLowerCase();
    const foundWords = BAD_WORDS.filter(word => lowerText.includes(word));
    if (foundWords.length > 0) {
        return { safe: false, reason: `Contenido sospechoso detectado: ${foundWords.join(', ')}` };
    }
    return { safe: true };
};


// --- DEV PATCH: notifications (dev-only) ---
const notificationsStore: Record<string, Array<any>> = {};
const favoriteNotificationCooldowns = {};

function addNotificationDev(userId: string, payload: { title: string; body?: string; meta?: any }) {
  if (!userId) return;
  if (!notificationsStore[userId]) notificationsStore[userId] = [];
  notificationsStore[userId].unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    title: payload.title,
    body: payload.body || '',
    read: false,
    createdAt: new Date().toISOString(),
    meta: payload.meta || null
  });
  if (notificationsStore[userId].length > 200) notificationsStore[userId].length = 200;
}

async function getNotificationsForUserDev(userId: string) {
  await new Promise(r => setTimeout(r, 40));
  return (notificationsStore[userId] || []).slice(0, 50);
}

async function markAllNotificationsReadDev(userId: string) {
  if (!notificationsStore[userId]) return;
  notificationsStore[userId] = notificationsStore[userId].map(n => ({ ...n, read: true }));
}

async function loginWithGoogleMock() {
  await new Promise(r => setTimeout(r, 120));
  const mockUser = { 
      id: 'google-mock-1', 
      name: 'Google Dev Mock', 
      email: 'google.mock@example.com', 
      emailVerified: true, 
      phoneVerified: true, 
      location: { country: 'España', city: 'Madrid', postalCode: '28013', address: 'Plaza Mayor, 1' }, 
      preferences: ['Libros', 'Música', 'Hogar'], 
      avatarUrl: DEFAULT_AVATAR_NEUTRAL, 
      ratings: [],
      following: [],
      notificationSettings: { newItemsFromFavorites: true },
      lastActiveAt: new Date().toISOString()
  };
  const token = 'mock-jwt-google-mock-1';
  const hasLocal = typeof window !== 'undefined' && window.localStorage;
  if (hasLocal) {
    window.localStorage.setItem('jwt_token', token);
  }
  return { user: mockUser, token };
}
// --- FIN PATCH ---


// --- START MOCK HASHING ---
const generateSalt = (length = 16) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const hashPassword = (password, salt) => {
    try {
        return btoa(password + salt);
    } catch (e) {
        return password + salt;
    }
};
// --- END MOCK HASHING ---


let users = [];
let items = [];
let exchanges = [];
let chats = [];
let itemLogs = []; // Store logs

const setupInitialData = () => {
    try {
        const data = typeof window !== 'undefined' ? window.localStorage.getItem('swapit_data') : null;
        if (data) {
            const parsedData = JSON.parse(data);
            if (parsedData.users && parsedData.users.length > 1 && parsedData.items) {
                 users = parsedData.users;
                 users = users.map(u => ({ ...u, lastActiveAt: u.lastActiveAt || u.createdAt || new Date().toISOString() }));
                 items = parsedData.items;
                 exchanges = parsedData.exchanges;
                 chats = parsedData.chats;
                 itemLogs = parsedData.itemLogs || [];
                 items = items.map(i => ({
                     ...i,
                     modificationCount: i.modificationCount || 0,
                     lastModifiedAt: i.lastModifiedAt || i.createdAt,
                     flagged: i.flagged || false,
                     flagReason: i.flagReason || null
                 }));
                 return;
            }
        }
    } catch (error) {
        console.error("Error loading data, resetting.", error);
        if (typeof window !== 'undefined') window.localStorage.removeItem('swapit_data');
    }

    // --- GENERATE TEST SCENARIO ---
    users = [];
    items = [];
    exchanges = [];
    chats = [];
    itemLogs = [];

    const adminSalt = generateSalt();
    const defaultContact = { enabled: false, name: '', email: '', phone: '', meetingPoint: '', preferredSchedule: '' };
    const defaultNotif = { newItemsFromFavorites: true };

    const createUser = (id, name, email, role = 'USER', locationCity = 'Madrid', avatar = DEFAULT_AVATAR_NEUTRAL, activeDaysAgo = 0) => ({
        id, name, email, role, salt: adminSalt,
        hashedPassword: hashPassword('password123', adminSalt),
        emailVerified: true, phoneVerified: true, phone: '600000000',
        location: { country: 'España', city: locationCity, postalCode: '28001', address: 'Calle Test' },
        preferences: ['Electrónica'], lastDataChange: null, columnLayout: null, gender: 'neutral',
        avatarUrl: avatar, ratings: [], following: [], notificationSettings: defaultNotif, contactCard: { ...defaultContact, name },
        isBanned: false,
        lastActiveAt: new Date(Date.now() - (activeDaysAgo * 24 * 60 * 60 * 1000)).toISOString()
    });

    users = [
        createUser('admin-1', 'Admin Supremo', 'azzazel69@gmail.com', 'SUPER_ADMIN', 'Valencia', DEFAULT_AVATAR_NEUTRAL, 0),
        createUser('user-1', 'Carlos Pérez', 'carlos@test.com', 'USER', 'Madrid', DEFAULT_AVATAR_MALE, 1),
        createUser('user-2', 'Lucía Gómez', 'lucia@test.com', 'USER', 'Barcelona', DEFAULT_AVATAR_FEMALE, 0),
        createUser('user-3', 'Pedro "El Troll"', 'pedro_troll@test.com', 'USER', 'Sevilla', DEFAULT_AVATAR_MALE, 2),
        createUser('user-4', 'Ana M.', 'ana@test.com', 'USER', 'Valencia', DEFAULT_AVATAR_FEMALE, 5),
        createUser('user-5', 'Miguel Tech', 'miguel@test.com', 'USER', 'Bilbao', DEFAULT_AVATAR_MALE, 0),
        createUser('user-6', 'Elena Vintage', 'elena@test.com', 'USER', 'Granada', DEFAULT_AVATAR_FEMALE, 10),
        createUser('user-7', 'Bot Scammer', 'scammer@test.com', 'USER', 'Madrid', DEFAULT_AVATAR_NEUTRAL, 0),
        createUser('user-8', 'David Gamer', 'david@test.com', 'USER', 'Málaga', DEFAULT_AVATAR_MALE, 1),
    ];
    users[0].hashedPassword = hashPassword('AdminPassword123', adminSalt);

    const createItem = (id, userId, title, cat, desc, status = 'AVAILABLE', bad = false) => {
        const owner = users.find(u => u.id === userId);
        const isFlagged = bad;
        return {
            id, userId, ownerName: owner.name, title, category: cat, description: desc,
            status, condition: 'GOOD', wishedItem: 'Algo interesante',
            imageUrls: [generatePlaceholderImage(bad ? `FLAGGED: ${title}` : title)],
            createdAt: new Date().toISOString(), likes: 0, favoritedBy: [],
            modificationCount: 0,
            lastModifiedAt: new Date().toISOString(),
            flagged: isFlagged,
            flagReason: isFlagged ? 'Detectado por filtro automático (palabras prohibidas en título)' : null
        };
    };

    items = [
        createItem('item-1', 'user-1', 'PlayStation 5', 'Electrónica', 'Casi nueva, con dos mandos.'),
        createItem('item-2', 'user-1', 'iPhone 12', 'Electrónica', 'Buen estado, pantalla intacta.'),
        createItem('item-3', 'user-2', 'Bolso de Cuero', 'Ropa y Accesorios', 'Vintage, color marrón.'),
        createItem('item-5', 'user-4', 'Bicicleta Montaña', 'Vehículos', 'Necesita engrasar cadena.'),
        createItem('item-9', 'user-3', 'Réplica de Arma', 'Coleccionismo', 'Parece real, ideal para asustar.', 'AVAILABLE', true),
        createItem('item-10', 'user-3', 'Medicamentos sin receta', 'Otros', 'Me sobraron del tratamiento.', 'AVAILABLE', true),
        createItem('item-11', 'user-7', 'Método ganar dinero', 'Servicios', 'Te enseño a ser rico rápido.', 'AVAILABLE', true),
    ];

    const createExchange = (id, requesterId, ownerId, reqItemId, offItemIds, status, messages) => {
        const reqUser = users.find(u => u.id === requesterId);
        const ownUser = users.find(u => u.id === ownerId);
        
        const ex = {
            id, requesterId, requesterName: reqUser.name,
            ownerId, ownerName: ownUser.name,
            requestedItemId: reqItemId, offeredItemIds: offItemIds,
            status, createdAt: new Date().toISOString(),
            deletedBy: [], ratings: {}, offeredOtherItems: [], acceptedOfferedItemIds: [],
            itemStatus: {} 
        };
        exchanges.push(ex);

        let chatFlagged = false;
        let chatReason = null;

        const chatMsgs = messages.map((msg, idx) => {
            const check = checkContentSafety(msg.text);
            if (!check.safe) {
                chatFlagged = true;
                chatReason = check.reason;
            }
            return {
                id: `msg-${id}-${idx}`,
                senderId: msg.sender === 'req' ? requesterId : ownerId,
                text: msg.text,
                timestamp: new Date(Date.now() - (10000 * (messages.length - idx))).toISOString(),
                type: 'TEXT'
            };
        });

        chats.push({ 
            id, 
            participantIds: [requesterId, ownerId], 
            messages: chatMsgs,
            flagged: chatFlagged,
            flagReason: chatReason
        });
    };

    createExchange('ex-1', 'user-2', 'user-1', 'item-1', ['item-3'], 'PENDING', [
        { sender: 'req', text: "Hola Carlos, te cambio la Play por mi bolso vintage." },
        { sender: 'own', text: "Hola Lucía, mmm no me convence mucho. ¿Tienes algo de electrónica?" }
    ]);

    createExchange('ex-2', 'user-3', 'user-4', 'item-5', [], 'PENDING', [
        { sender: 'req', text: "Oye dame la bici gratis." },
        { sender: 'own', text: "No, es un intercambio." },
        { sender: 'req', text: "Eres una estúpida." },
        { sender: 'own', text: "Te voy a denunciar." }
    ]);

    createExchange('ex-3', 'user-7', 'user-5', 'item-5', [], 'PENDING', [
        { sender: 'req', text: "Hola, me interesa." },
        { sender: 'req', text: "Hablamos por WhatsApp mejor, fuera de la app." },
    ]);
    
    persistData();
};

const persistData = () => {
    if (typeof window !== 'undefined') {
        const data = JSON.stringify({ users, items, exchanges, chats, itemLogs });
        window.localStorage.setItem('swapit_data', data);
    }
}

setupInitialData();

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// --- LOG HELPER ---
const recordItemLog = (action, item, changes = null, actorId) => {
    const logEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: item.id,
        itemTitle: item.title,
        itemOwnerId: item.userId,
        actorId: actorId,
        action: action,
        changes: changes,
        timestamp: new Date().toISOString()
    };
    itemLogs.unshift(logEntry);
    if (itemLogs.length > 1000) itemLogs.pop();
};

class ApiClient {
  token = null;

  _getCurrentUserFromToken() {
    if (!this.token) return null;
    const userId = this.token.replace('fake-jwt-for-', '').replace('mock-jwt-google-mock-1', 'google-mock-1');
    if (userId === 'google-mock-1') {
        let mockUser = users.find(u => u.id === 'google-mock-1');
        if (!mockUser) { /* create mock logic */ }
        mockUser.lastActiveAt = new Date().toISOString();
        persistData();
        return mockUser;
    }
    const user = users.find(u => u.id === userId);
    if (user) {
        user.lastActiveAt = new Date().toISOString();
        persistData();
    }
    return user;
  }

  _enrichItem(item, currentUser, currentUserItemsCache) {
      if (!item) return null;
      const owner = users.find(u => u.id === item.userId);
      if (!currentUser) {
           return { 
              ...item,
              isFavorited: false,
              isMatch: false,
              ownerLocation: owner ? owner.location : null,
              ownerAvatarUrl: owner ? owner.avatarUrl : DEFAULT_AVATAR_NEUTRAL
          };
      }
      const isFavorited = (item.favoritedBy || []).includes(currentUser.id);
      const currentUserItems = currentUserItemsCache || items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE');
      const isMatch = currentUserItems.some(userItem =>
        (userItem.wishedItem && typeof item.title === 'string' && item.title.toLowerCase().includes(userItem.wishedItem.toLowerCase())) &&
        (item.wishedItem && typeof userItem.title === 'string' && userItem.title.toLowerCase().includes(item.wishedItem.toLowerCase()))
      );
      return { ...item, isFavorited, isMatch, ownerLocation: owner ? owner.location : null, ownerAvatarUrl: owner ? owner.avatarUrl : DEFAULT_AVATAR_NEUTRAL };
  }

  async simulateDelay(ms = 500) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  setToken(token) { this.token = token; }
  
  async login(email, password) {
      await this.simulateDelay();
      const user = users.find(u => u.email === email);
      if (user && user.hashedPassword === hashPassword(password, user.salt)) {
          if (user.isBanned) throw new Error('Esta cuenta ha sido suspendida por violar los términos de servicio.');
          const dummyToken = `fake-jwt-for-${user.id}`;
          this.setToken(dummyToken);
          return { token: dummyToken };
      } else {
          throw new Error('Correo o contraseña incorrectos.');
      }
  }
  
  async loginWithGoogle(credential) {
      await this.simulateDelay();
      const googleUser = parseJwt(credential);
      let user = users.find(u => u.email === googleUser.email);
      if (user && user.isBanned) throw new Error('Cuenta suspendida.');
      if (!user) { /* Registration logic */ }
      const dummyToken = `fake-jwt-for-${user ? user.id : 'new'}`; 
      this.setToken(dummyToken);
      return { token: dummyToken };
  }

  async register(name, email, password, gender, phone) {
      await this.simulateDelay();
      if (users.some(u => u.email === email)) throw new Error('Ya existe un usuario con este correo.');
      if (phone) {
          const accountsWithPhone = users.filter(u => u.phone === phone);
          if (accountsWithPhone.length >= MAX_ACCOUNTS_PER_PHONE) {
              throw new Error('REQ_ID_VERIFICATION');
          }
      }
      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);
      const newUser = {
          id: String(users.length + 1),
          name, email, role: 'USER', salt, hashedPassword,
          preferences: [], emailVerified: false, verificationToken: '123', phoneVerified: false,
          phone: phone || '',
          lastDataChange: null, columnLayout: null, gender, avatarUrl: DEFAULT_AVATAR_NEUTRAL,
          ratings: [], contactCard: {}, following: [], notificationSettings: {}, isBanned: false,
          lastActiveAt: new Date().toISOString()
      };
      users.push(newUser);
      persistData();
      return newUser;
  }

  async submitIdentityVerification(file: any) {
      await this.simulateDelay(1500);
      return { success: true, message: 'Documento recibido. Verificación en proceso.' };
  }

  async verifyEmailWithToken(token) { await this.simulateDelay(100); return { success: true, email: 'test@test.com' }; }

  async getCurrentUser() {
      await this.simulateDelay(200);
      if (!this.token) throw new Error('No autenticado');
      const user = this._getCurrentUserFromToken();
      if (user) {
          if (user.isBanned) throw new Error('Tu cuenta ha sido baneada.');
          if (!user.notificationSettings) user.notificationSettings = { newItemsFromFavorites: true };
          if (!user.following) user.following = [];
          const { hashedPassword: _, salt: __, ...userToReturn } = user;
          return userToReturn;
      }
      throw new Error('Usuario no encontrado');
  }
  
  async reportContent(id, type, reason) { // type: 'ITEM' or 'CHAT'
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida para reportar.');

      if (type === 'ITEM') {
          const item = items.find(i => i.id === id);
          if (!item) throw new Error('Artículo no encontrado');
          item.flagged = true;
          item.flagReason = `[Reporte de Usuario]: ${reason}`;
      } else if (type === 'CHAT') {
          const chat = chats.find(c => c.id === id);
          if (!chat) throw new Error('Chat no encontrado');
          chat.flagged = true;
          chat.flagReason = `[Reporte de Usuario]: ${reason}`;
      }
      persistData();
      return { success: true };
  }
  
  async getHomePageData({ page = 1, limit = 12 }) {
    await this.simulateDelay(300);
    const currentUser = this._getCurrentUserFromToken();
    const currentUserItems = items.filter(i => currentUser && i.userId === currentUser.id && i.status === 'AVAILABLE');
    const allEnrichedItems = items
        .filter(i => !i.flagged) 
        .map(item => this._enrichItem(item, currentUser, currentUserItems));
    
    const exploreItems = allEnrichedItems.filter(item => item && (!currentUser || item.userId !== currentUser.id) && item.status === 'AVAILABLE');
    
    let followedUsersItems = [];
    if (currentUser && currentUser.following) {
        followedUsersItems = exploreItems.filter(item => currentUser.following.includes(item.userId));
    }

    let directMatches = [];
    if (currentUserItems.length > 0) {
        directMatches = exploreItems.filter(item => item.isMatch);
    }

    return { 
        exploreItems: exploreItems.slice((page - 1) * limit, page * limit), 
        totalExploreItems: exploreItems.length,
        directMatches: directMatches.slice(0, 4),
        recommended: exploreItems.slice(0, 4),
        followedUsersItems: followedUsersItems.slice(0, 4)
    }; 
  }

  async getItemById(itemId) {
      await this.simulateDelay(100);
      const currentUser = this._getCurrentUserFromToken();
      const item = items.find(item => item.id === itemId);
      return this._enrichItem(item, currentUser, []);
  }
  
  async getUserItems(userId) {
      await this.simulateDelay();
      const userItems = items.filter(item => item.userId === userId && !item.flagged);
      return userItems.map(item => this._enrichItem(item, null, []));
  }

  async getUserProfile(userId) {
      await this.simulateDelay();
      const user = users.find(u => u.id === userId);
      const userItems = items.filter(i => i.userId === userId && i.status === 'AVAILABLE' && !i.flagged);
      return { ...user, items: userItems };
  }
  
  async createItem(itemData) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      if (currentUser.isBanned) throw new Error('Usuario baneado');

      const titleCheck = checkContentSafety(itemData.title);
      const descCheck = checkContentSafety(itemData.description);
      const isFlagged = !titleCheck.safe || !descCheck.safe;
      const flagReason = !titleCheck.safe ? titleCheck.reason : (!descCheck.safe ? descCheck.reason : null);

      const newItem = {
          id: `item-${Date.now()}`,
          userId: currentUser.id,
          ownerName: currentUser.name,
          ...itemData,
          status: 'AVAILABLE',
          createdAt: new Date().toISOString(),
          likes: 0,
          favoritedBy: [],
          modificationCount: 0,
          lastModifiedAt: new Date().toISOString(),
          flagged: isFlagged,
          flagReason: flagReason
      };
      items.unshift(newItem);
      
      recordItemLog('CREATE', newItem, null, currentUser.id);

      if (isFlagged) {
          console.warn("Item flagged by auto-mod:", newItem.title);
      }

      persistData();
      return newItem;
  }

  async updateItem(itemId, itemData) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');

      const itemIndex = items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) throw new Error('Artículo no encontrado');
      const item = items[itemIndex];
      if (item.userId !== currentUser.id) throw new Error('No autorizado');

      const titleCheck = checkContentSafety(itemData.title || item.title);
      const descCheck = checkContentSafety(itemData.description || item.description);
      const isFlagged = !titleCheck.safe || !descCheck.safe;
      const flagReason = isFlagged ? (titleCheck.reason || descCheck.reason) : null;

      // DIFF LOGIC
      const changes = [];
      if (itemData.title && itemData.title !== item.title) changes.push({ field: 'title', old: item.title, new: itemData.title });
      if (itemData.description && itemData.description !== item.description) changes.push({ field: 'description', old: item.description, new: itemData.description });
      if (itemData.category && itemData.category !== item.category) changes.push({ field: 'category', old: item.category, new: itemData.category });
      if (itemData.condition && itemData.condition !== item.condition) changes.push({ field: 'condition', old: item.condition, new: itemData.condition });
      if (itemData.wishedItem && itemData.wishedItem !== item.wishedItem) changes.push({ field: 'wishedItem', old: item.wishedItem, new: itemData.wishedItem });
      
      if (itemData.imageUrls) {
          const oldImages = JSON.stringify(item.imageUrls);
          const newImages = JSON.stringify(itemData.imageUrls);
          if (oldImages !== newImages) {
              changes.push({ field: 'images', old: `${item.imageUrls.length} fotos`, new: `${itemData.imageUrls.length} fotos` });
          }
      }

      const updatedItem = { 
          ...item, 
          ...itemData, 
          updatedAt: new Date().toISOString(),
          lastModifiedAt: new Date().toISOString(),
          modificationCount: (item.modificationCount || 0) + 1,
          flagged: isFlagged,
          flagReason: flagReason
      };
      items[itemIndex] = updatedItem;
      
      recordItemLog('UPDATE', updatedItem, changes, currentUser.id);

      persistData();
      return updatedItem;
  }

  async deleteItem(itemId) {
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      
      const idx = items.findIndex(i => i.id === itemId);
      if (idx > -1) {
          const item = items[idx];
          if (item.userId !== currentUser.id && currentUser.role !== 'SUPER_ADMIN') throw new Error('No autorizado');
          
          recordItemLog('DELETE', item, null, currentUser.id);
          items.splice(idx, 1);
          persistData();
          return { success: true };
      }
      throw new Error('Item not found');
  }
  
  // ... exchanges, proposals, chats ...
  async getExchanges() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Auth required');
      return exchanges.filter(ex => (ex.requesterId === currentUser.id || ex.ownerId === currentUser.id)).map(ex => ({
          ...ex,
          requestedItem: items.find(i => i.id === ex.requestedItemId) || { title: 'Deleted' },
          offeredItems: ex.offeredItemIds.map(id => items.find(i => i.id === id)).filter(Boolean)
      }));
  }

  async createExchangeProposal(proposal) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      const exId = `ex-${Date.now()}`;
      const newEx = { id: exId, requesterId: currentUser.id, ownerId: 'mock', status: 'PENDING', offeredItemIds: proposal.offeredItemIds, requestedItemId: proposal.requestedItemId };
      exchanges.push(newEx);
      chats.push({ id: exId, participantIds: [currentUser.id, 'mock'], messages: [] });
      persistData();
      return newEx;
  }
  
  async getChatAndExchangeDetails(chatId) {
    await this.simulateDelay(100);
    const currentUser = this._getCurrentUserFromToken();
    const chat = chats.find(c => c.id === chatId);
    const exchange = exchanges.find(ex => ex.id === chatId);
    
    const isAdmin = currentUser.role === 'SUPER_ADMIN';
    const isParticipant = chat?.participantIds.includes(currentUser.id);

    if (!chat || !exchange || (!isParticipant && !isAdmin)) {
        throw new Error('Chat no encontrado o acceso denegado.');
    }
    
    const owner = users.find(u => u.id === exchange.ownerId);
    const requester = users.find(u => u.id === exchange.requesterId);
    
    const ownerPublic = owner ? { ...owner, hashedPassword: null, salt: null } : null;
    const requesterPublic = requester ? { ...requester, hashedPassword: null, salt: null } : null;

    const allItemIds = [...new Set([exchange.requestedItemId, ...exchange.offeredItemIds])];
    const regularItems = allItemIds.map(id => items.find(item => item.id === id)).filter(Boolean);
    
    const detailedExchange = { ...exchange, allItems: regularItems, owner: ownerPublic, requester: requesterPublic };
    return { chat, exchange: detailedExchange };
  }
  
  async sendMessage(chatId, text) {
      await this.simulateDelay(100);
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      if (currentUser.isBanned) throw new Error('No puedes enviar mensajes, tu cuenta está baneada.');
      
      const chat = chats.find(c => c.id === chatId);
      
      const safetyCheck = checkContentSafety(text);
      if (!safetyCheck.safe) {
          chat.flagged = true;
          chat.flagReason = safetyCheck.reason;
          console.warn("Chat flagged due to toxic message");
      }

      const newMessage = {
          id: `msg-${Date.now()}`,
          senderId: currentUser.id,
          text,
          timestamp: new Date().toISOString(),
          type: 'TEXT',
      };
      
      chat.messages.push(newMessage);
      persistData();
      return newMessage;
  }

  async respondToExchange(exId, action) { /*...*/ } 
  async modifyExchangeProposal(exId, data) { /*...*/ }
  async addCounterOffer(exId, items) { /*...*/ }
  async rateUserAndCompleteExchange(exId, rating) { /*...*/ }
  async deleteExchanges(ids) { /*...*/ }

  async toggleFollowUser(id) { /*...*/ return { isFollowing: true }; }
  async updateUserProfileData(data) { /*...*/ return {}; }
  async canEditProfile() { return { canEdit: true }; }
  async getFavoriteItems() { return []; }
  async toggleFavorite(id) { return {}; }
  async resizeImageBeforeUpload(f) { return "data:image/png;base64,mock"; }
  
  // --- ADMIN FUNCTIONS ---
  
  async _verifyAdmin() {
    const currentUser = this._getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
        throw new Error('Acción no autorizada.');
    }
  }

  async getAdminDashboardStats() {
    await this._verifyAdmin();
    await this.simulateDelay(100);
    const activeUsers = users.filter(u => {
        const lastActive = new Date(u.lastActiveAt).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        return (Date.now() - lastActive) < thirtyDays;
    }).length;

    return {
        totalUsers: users.length,
        totalItems: items.length,
        activeExchanges: exchanges.filter(ex => ex.status === 'PENDING' || ex.status === 'ACCEPTED').length,
        flaggedItems: items.filter(i => i.flagged).length,
        flaggedChats: chats.filter(c => c.flagged).length,
        activeUsers
    };
  }

  async getAllUsersForAdmin() {
    await this._verifyAdmin();
    return users.map(u => ({ ...u, hashedPassword: null, salt: null }));
  }
  
  async banUser(userId) {
      await this._verifyAdmin();
      const user = users.find(u => u.id === userId);
      if (user) {
          user.isBanned = !user.isBanned; 
          persistData();
          return { success: true, isBanned: user.isBanned };
      }
      throw new Error("Usuario no encontrado");
  }

  async getAllItemsForAdmin() {
    await this._verifyAdmin();
    return items.map(item => ({
        ...item,
        ownerName: users.find(u => u.id === item.userId)?.name || 'Desconocido',
    }));
  }

  async getAllExchangesForAdmin() {
    await this._verifyAdmin();
    return exchanges.map(ex => ({
        ...ex,
        ownerName: users.find(u => u.id === ex.ownerId)?.name,
        requesterName: users.find(u => u.id === ex.requesterId)?.name,
        requestedItemTitle: items.find(i => i.id === ex.requestedItemId)?.title || 'Artículo Eliminado'
    }));
  }

  async adminAdvancedSearchExchanges({ query, status, page = 1, limit = 20 }) {
    await this._verifyAdmin();
    await this.simulateDelay(200);

    const normalizedQuery = query ? query.toLowerCase().trim() : '';
    const userMentions = normalizedQuery.match(/@(\w+)/g) || [];
    const searchTerms = normalizedQuery.replace(/@(\w+)/g, '').trim();
    
    const userIdsToFilter = [];
    if (userMentions.length > 0) {
        const mentionedNames = userMentions.map(m => m.substring(1)); 
        users.forEach(u => {
            if (mentionedNames.some(name => u.name.toLowerCase().includes(name))) {
                userIdsToFilter.push(u.id);
            }
        });
    }

    let filteredExchanges = exchanges;

    if (userMentions.length > 0) {
        filteredExchanges = filteredExchanges.filter(ex => 
            userIdsToFilter.includes(ex.ownerId) || userIdsToFilter.includes(ex.requesterId)
        );
    }

    if (status && status !== 'ALL') {
        filteredExchanges = filteredExchanges.filter(ex => ex.status === status);
    }

    if (searchTerms) {
        filteredExchanges = filteredExchanges.filter(ex => {
            const chat = chats.find(c => c.id === ex.id);
            return chat && chat.messages.some(msg => msg.text && msg.text.toLowerCase().includes(searchTerms));
        });
    }

    const total = filteredExchanges.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pagedExchanges = filteredExchanges.slice(start, end);

    const results = pagedExchanges.map(ex => {
        const owner = users.find(u => u.id === ex.ownerId);
        const requester = users.find(u => u.id === ex.requesterId);
        const chat = chats.find(c => c.id === ex.id);
        return {
            ...ex,
            ownerName: owner?.name,
            requesterName: requester?.name,
            requestedItemTitle: items.find(i => i.id === ex.requestedItemId)?.title,
            lastMessageDate: chat && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].timestamp : ex.createdAt,
            flagged: chat?.flagged,
            flagReason: chat?.flagReason
        };
    });

    results.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());

    return { exchanges: results, total, page, totalPages: Math.ceil(total / limit) };
  }

  async censorMessage(chatId, messageId) {
      await this._verifyAdmin();
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
          const msg = chat.messages.find(m => m.id === messageId);
          if (msg) {
              msg.text = "[CONTENIDO ELIMINADO POR MODERACIÓN]";
              msg.type = 'SYSTEM';
              persistData();
              return { success: true };
          }
      }
      throw new Error("Mensaje no encontrado");
  }

  async getModerationQueue() {
      await this._verifyAdmin();
      await this.simulateDelay();
      
      const flaggedItems = items.filter(i => i.flagged);
      const flaggedChats = chats.filter(c => c.flagged).map(chat => {
          const ex = exchanges.find(e => e.id === chat.id);
          const owner = users.find(u => u.id === ex.ownerId);
          const requester = users.find(u => u.id === ex.requesterId);
          return {
              id: chat.id,
              type: 'CHAT',
              reason: chat.flagReason,
              preview: `Chat entre ${requester.name} y ${owner.name}`,
              date: chat.messages[chat.messages.length - 1]?.timestamp || new Date().toISOString()
          };
      });

      const formattedItems = flaggedItems.map(item => ({
          id: item.id,
          type: 'ITEM',
          reason: item.flagReason,
          preview: item.title,
          date: item.createdAt
      }));

      return [...formattedItems, ...flaggedChats];
  }
  
  async resolveModeration(id, type, action) {
      await this._verifyAdmin();
      if (type === 'ITEM') {
          const item = items.find(i => i.id === id);
          if (item) {
              if (action === 'APPROVE') {
                  item.flagged = false;
                  item.flagReason = null;
              } else if (action === 'DELETE') {
                  await this.deleteItemByAdmin(id);
              }
          }
      } else if (type === 'CHAT') {
          const chat = chats.find(c => c.id === id);
          if (chat) {
              if (action === 'DISMISS') {
                  chat.flagged = false;
                  chat.flagReason = null;
              } else if (action === 'DELETE_CHAT') {
                  const exchangeIndex = exchanges.findIndex(ex => ex.id === id);
                  const chatIndex = chats.findIndex(c => c.id === id);
                  
                  if (exchangeIndex > -1 && chatIndex > -1) {
                      const exchange = exchanges[exchangeIndex];
                      const deletionReason = chat.flagReason || 'Violación de las normas de la comunidad';
                      [exchange.requesterId, exchange.ownerId].forEach(uid => {
                          addNotificationDev(uid, {
                              title: 'Aviso de Moderación',
                              body: `Un chat ha sido eliminado por moderación. Motivo: ${deletionReason}.`,
                              meta: { type: 'system_alert' }
                          });
                      });
                      exchanges.splice(exchangeIndex, 1);
                      chats.splice(chatIndex, 1);
                  }
              }
          }
      }
      persistData();
      return { success: true };
  }
  
  async deleteItemByAdmin(itemId) {
    const currentUser = this._getCurrentUserFromToken();
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        const item = items[itemIndex];
        recordItemLog('DELETE', item, null, currentUser.id);
        items.splice(itemIndex, 1);
        persistData();
        return { success: true };
    }
    throw new Error('Item not found');
  }
  
  async deleteUserByAdmin(userId) {
      items = items.filter(item => item.userId !== userId);
      exchanges.forEach(ex => { if (ex.ownerId === userId || ex.requesterId === userId) ex.status = 'CANCELADO'; });
      users = users.filter(user => user.id !== userId);
      persistData();
      return { success: true };
  }

  // --- AUDIT LOGS QUERY ---
  async getAdminAuditLogs({ query, page = 1, limit = 20 }) {
      await this._verifyAdmin();
      await this.simulateDelay(200);

      let filteredLogs = itemLogs;
      const searchTerm = query ? query.toLowerCase().trim() : '';

      if (searchTerm) {
          filteredLogs = filteredLogs.filter(log => {
              const actor = users.find(u => u.id === log.actorId);
              const actorName = actor ? actor.name.toLowerCase() : 'desconocido';
              return (
                  log.itemTitle.toLowerCase().includes(searchTerm) ||
                  actorName.includes(searchTerm) ||
                  log.itemId.includes(searchTerm)
              );
          });
      }

      // Enrich logs
      const enrichedLogs = filteredLogs.map(log => {
          const actor = users.find(u => u.id === log.actorId);
          return { ...log, actorName: actor ? actor.name : 'Usuario Eliminado' };
      });

      const total = enrichedLogs.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedLogs = enrichedLogs.slice(start, end);

      return { logs: paginatedLogs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUserColumnLayout(layout) { /*...*/ return {}; }
  async updateUserAvatar(image) { /*...*/ return {}; }
  async updateUserPassword(c, n) { /*...*/ return {}; }
  async changeUserPhone(p) { /*...*/ return {}; }
  async verifyPhoneCode(c) { /*...*/ return true; }
  async sendPhoneVerificationCode(p) { /*...*/ return { success: true }; }
  async updateUserPreferences(p) { /*...*/ return {}; }
  async updateNotificationSettings(s) { /*...*/ return {}; }
  async updateUserLocation(l) { /*...*/ return {}; }
  async requestPasswordReset(e) { /*...*/ return { message: 'ok' }; }
  async verifyEmail() { /*...*/ return { success: true }; }
  async saveFcmToken(t) { /*...*/ return { success: true }; }
}

export const viewHistoryService = {
  getHistory: () => [],
  addItem: (item) => {}
};

export const api = new ApiClient();

// @ts-ignore
api.addNotificationDev = addNotificationDev;
// @ts-ignore
api.getNotificationsForUserDev = getNotificationsForUserDev;
// @ts-ignore
api.markAllNotificationsReadDev = markAllNotificationsReadDev;
// @ts-ignore
api.loginWithGoogleMock = loginWithGoogleMock;
