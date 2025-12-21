
import { ExchangeStatus, ItemCondition } from '../types.ts';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';

// --- Constants & Config ---
const BAD_WORDS = ['estafa', 'robo', 'arma', 'droga', 'idiota', 'estupida', 'imbecil', 'bizum', 'whatsapp', 'fuera de la app', 'matar', 'muerte', 'sexo', 'desnudo'];

// --- Default Avatars ---
export const DEFAULT_AVATAR_NEUTRAL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0UwRTAxMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
export const DEFAULT_AVATAR_MALE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0JCREVGQiI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
export const DEFAULT_AVATAR_FEMALE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0Y4QkJETCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

// --- Helper function to generate placeholder images ---
const generatePlaceholderImage = (text: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
        if (metrics.width > maxWidth && n > 0) {
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

// --- DATA ---
let users = [];
let items = [];
let exchanges = [];
let chats = [];
let itemLogs = [];
let reportedContent = [];

const persistData = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('swapit_data', JSON.stringify({ users, items, exchanges, chats, itemLogs, reportedContent }));
    }
};

const setupInitialData = () => {
    try {
        const data = typeof window !== 'undefined' ? window.localStorage.getItem('swapit_data') : null;
        if (data) {
            const parsedData = JSON.parse(data);
            users = parsedData.users || [];
            items = parsedData.items || [];
            exchanges = parsedData.exchanges || [];
            chats = parsedData.chats || [];
            itemLogs = parsedData.itemLogs || [];
            reportedContent = parsedData.reportedContent || [];
            if (users.length > 0) return;
        }
    } catch (e) {}

    const adminSalt = 'salt123';
    const createUser = (id, name, email, role = 'USER', locationCity = 'Madrid', lat = 40.4168, lng = -3.7038, avatar = DEFAULT_AVATAR_NEUTRAL) => ({
        id, name, email, role, salt: adminSalt,
        hashedPassword: btoa('password123' + adminSalt),
        emailVerified: true, phoneVerified: true, phone: '600000000',
        location: { country: 'España', city: locationCity, province: 'Madrid', postalCode: '28001', address: 'Calle Principal', lat, lng },
        preferences: ['Electrónica', 'Hogar y Muebles'],
        avatarUrl: avatar, ratings: [], following: [], notificationSettings: { newItemsFromFavorites: true },
        isBanned: false, lastActiveAt: new Date().toISOString(), columnLayout: null,
        contactCard: { 
            enabled: true, name, email, phone: '600000000', 
            meetingPointAddress: 'Plaza del Sol, Madrid',
            meetingPointCoords: { lat, lng },
            meetingPointComment: 'En la estatua del Oso y el Madroño',
            preferredSchedule: 'Tardes' 
        }
    });

    users = [
        createUser('admin-1', 'Admin Supremo', 'azzazel69@gmail.com', 'SUPER_ADMIN', 'Valencia', 39.4699, -0.3763, DEFAULT_AVATAR_NEUTRAL),
        createUser('user-1', 'Carlos Pérez', 'carlos@test.com', 'USER', 'Madrid', 40.4168, -3.7038, DEFAULT_AVATAR_MALE),
        createUser('user-2', 'Lucía Gómez', 'lucia@test.com', 'USER', 'Barcelona', 41.3851, 2.1734, DEFAULT_AVATAR_FEMALE),
        createUser('user-3', 'Pedro Troll', 'pedro_troll@test.com', 'USER', 'Sevilla', 37.3891, -5.9845, DEFAULT_AVATAR_MALE),
        createUser('user-4', 'Ana M.', 'ana@test.com', 'USER', 'Valencia', 39.4700, -0.3764, DEFAULT_AVATAR_FEMALE),
        createUser('user-7', 'Bot Scammer', 'scammer@test.com', 'USER', 'Madrid', 40.4170, -3.7040, DEFAULT_AVATAR_NEUTRAL),
    ];
    users[0].hashedPassword = btoa('AdminPassword123' + adminSalt);

    const createItem = (id, userId, title, cat, desc, wished = 'Algo de electrónica') => {
        const owner = users.find(u => u.id === userId);
        return {
            id, userId, ownerName: owner.name, title, category: cat, description: desc,
            status: 'AVAILABLE', condition: 'NUEVO', wishedItem: wished,
            imageUrls: [generatePlaceholderImage(title)],
            createdAt: new Date().toISOString(), likes: 0, favoritedBy: [],
            modificationCount: 0, lastModifiedAt: new Date().toISOString(), flagged: false
        };
    };

    items = [
        createItem('item-1', 'user-1', 'PlayStation 5', 'Electrónica', 'Nueva en caja', 'Bolso de Cuero'),
        createItem('item-2', 'user-1', 'iPhone 12', 'Electrónica', 'Como nuevo', 'Bicicleta Montaña'),
        createItem('item-3', 'user-2', 'Bolso de Cuero', 'Ropa y Accesorios', 'Vintage original', 'PlayStation 5'),
        createItem('item-4', 'user-4', 'Bicicleta Montaña', 'Vehículos', 'Poco uso', 'iPhone 12'),
        createItem('item-5', 'user-7', 'Ganar dinero ya', 'Servicios', 'Escríbeme fuera', 'BTC'),
    ];

    persistData();
};

setupInitialData();

class ApiClient {
  token = null;

  _getCurrentUserFromToken() {
    if (!this.token) return null;
    const userId = this.token.replace('fake-jwt-for-', '');
    return users.find(u => u.id === userId);
  }

  async simulateDelay(ms = 100) { return new Promise(r => setTimeout(r, ms)); }
  setToken(t) { this.token = t; }

  async login(email, password) {
      const u = users.find(u => u.email === email && u.hashedPassword === btoa(password + u.salt));
      if (!u) throw new Error('Credenciales inválidas');
      if (u.isBanned) throw new Error('Cuenta suspendida');
      this.token = `fake-jwt-for-${u.id}`;
      return { token: this.token };
  }

  async loginWithGoogle(credential) {
      await this.simulateDelay();
      const mockUser = users[1];
      this.token = `fake-jwt-for-${mockUser.id}`;
      return { token: this.token };
  }

  async register(name, email, password, avatar, locationData = null) {
      await this.simulateDelay();
      const id = `user-${Date.now()}`;
      const salt = 'salt' + Math.random().toString(36).slice(2, 5);
      const newUser = {
          id, name, email, role: 'USER', salt,
          hashedPassword: btoa(password + salt),
          emailVerified: false, phoneVerified: false, phone: '',
          location: locationData ? { ...locationData } : null,
          preferences: [],
          avatarUrl: avatar || DEFAULT_AVATAR_NEUTRAL, ratings: [], following: [], notificationSettings: { newItemsFromFavorites: true },
          isBanned: false, lastActiveAt: new Date().toISOString(), columnLayout: null,
          contactCard: { enabled: false, name, email, phone: '', meetingPointAddress: '', meetingPointCoords: null, meetingPointComment: '', preferredSchedule: '' }
      };
      users.push(newUser);
      persistData();
      this.token = `fake-jwt-for-${id}`;
      return { user: newUser, token: this.token };
  }

  async getCurrentUser() {
      const u = this._getCurrentUserFromToken();
      if (!u) throw new Error('No autorizado');
      return { ...u, hashedPassword: null, salt: null };
  }

  async updateUserLocation(location) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.location = { ...user.location, ...location };
          persistData();
      }
  }

  async getHomePageData({ page = 1, limit = 12 }) {
      const user = this._getCurrentUserFromToken();
      const allValid = items.filter(i => !i.flagged && i.status === 'AVAILABLE' && i.userId !== user?.id);
      return { 
          exploreItems: allValid.slice((page-1)*limit, page*limit),
          totalExploreItems: allValid.length,
          directMatches: [],
          recommended: [],
          followedUsersItems: []
      };
  }

  async getItemById(id) {
      return items.find(i => i.id === id);
  }

  async getUserItems(uid) { 
      return items.filter(i => i.userId === uid); 
  }

  async createItem(data) {
      const user = this._getCurrentUserFromToken();
      const newItem = { id: `item-${Date.now()}`, userId: user.id, ownerName: user.name, ...data, status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 0, favoritedBy: [], modificationCount: 0, lastModifiedAt: new Date().toISOString(), flagged: false };
      items.unshift(newItem);
      persistData();
      return newItem;
  }

  async deleteItem(itemId) {
      const index = items.findIndex(i => i.id === itemId);
      if (index > -1) {
          items.splice(index, 1);
          persistData();
      }
  }

  // --- Missing methods implementation ---

  async deleteExchanges(ids) {
    exchanges = exchanges.filter(ex => !ids.includes(ex.id));
    persistData();
  }

  async updateUserPassword(current, newP) {
    const user = this._getCurrentUserFromToken();
    if (!user) throw new Error('No autorizado');
    if (user.hashedPassword !== btoa(current + user.salt)) throw new Error('Contraseña actual incorrecta');
    user.hashedPassword = btoa(newP + user.salt);
    persistData();
  }

  async createExchangeProposal(data) {
    const user = this._getCurrentUserFromToken();
    if (!user) throw new Error('No autorizado');
    const targetItem = items.find(i => i.id === data.requestedItemId);
    if (!targetItem) throw new Error('Artículo no encontrado');
    const id = `ex-${Date.now()}`;
    const newEx = {
        id, 
        requesterId: user.id, 
        requesterName: user.name,
        ownerId: targetItem.userId,
        ownerName: targetItem.ownerName,
        requestedItemId: data.requestedItemId,
        requestedItem: targetItem,
        offeredItemIds: data.offeredItemIds,
        offeredItems: items.filter(i => data.offeredItemIds.includes(i.id)),
        offeredOtherItems: data.otherItems || [],
        message: data.message || '',
        status: 'PENDING',
        createdAt: new Date().toISOString()
    };
    exchanges.push(newEx);
    persistData();
    return newEx;
  }

  async sendMessage(exchangeId, text) {
    const user = this._getCurrentUserFromToken();
    if (!user) throw new Error('No autorizado');
    let chat = chats.find(c => c.exchangeId === exchangeId);
    if (!chat) {
        chat = { exchangeId, messages: [] };
        chats.push(chat);
    }
    chat.messages.push({
        id: `msg-${Date.now()}`,
        senderId: user.id,
        text,
        timestamp: new Date().toISOString()
    });
    persistData();
  }

  async respondToExchange(exchangeId, action) {
    const ex = exchanges.find(e => e.id === exchangeId);
    if (ex) {
        ex.status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
        if (action === 'ACCEPT') ex.acceptedAt = new Date().toISOString();
        persistData();
    }
  }

  async modifyExchangeProposal(exchangeId, data) {
    const ex = exchanges.find(e => e.id === exchangeId);
    if (ex) {
        ex.offeredItemIds = data.offeredItemIds;
        ex.offeredItems = items.filter(i => data.offeredItemIds.includes(i.id));
        ex.offeredOtherItems = data.otherItems || [];
        ex.message = data.message || ex.message;
        persistData();
    }
  }

  async censorMessage(exchangeId, messageId) {
    const chat = chats.find(c => c.exchangeId === exchangeId);
    if (chat) {
        const msg = chat.messages.find(m => m.id === messageId);
        if (msg) msg.text = "[CONTENIDO ELIMINADO POR MODERACIÓN]";
        persistData();
    }
  }

  async resolveModeration(id, type, action) {
    if (type === 'ITEM') {
        if (action === 'DELETE') {
            await this.deleteItem(id);
        } else if (action === 'APPROVE') {
            const item = items.find(i => i.id === id);
            if (item) item.flagged = false;
        }
    } else if (type === 'CHAT') {
        if (action === 'DELETE_CHAT') {
            exchanges = exchanges.filter(ex => ex.id !== id);
            chats = chats.filter(c => c.exchangeId !== id);
        }
    }
    persistData();
  }

  async deleteItemByAdmin(itemId) {
    await this.deleteItem(itemId);
  }

  async acceptMeetingLocation(exchangeId, address, type) {
    const ex = exchanges.find(e => e.id === exchangeId);
    if (ex) {
        ex.acceptedMeetingPoint = address;
        persistData();
    }
  }
  
  // Stubs for required methods from UI
  async loginWithGoogleMock() { return this.loginWithGoogle(""); }
  async getNotificationsForUserDev(id) { return []; }
  async markAllNotificationsReadDev(id) { return; }
  async markChatAsRead(id) { return; }
  async resizeImageBeforeUpload(f) { return URL.createObjectURL(f); }
  async toggleFavorite(id) { return items.find(i => i.id === id); }
  async updateUserColumnLayout(l) { return; }
  async updateItem(id, d) { 
    const item = items.find(i => i.id === id);
    if(item) Object.assign(item, d);
    persistData();
    return item;
  }
  async reportContent(id, t, r) { return; }
  async verifyEmail() { const u = this._getCurrentUserFromToken(); if(u) u.emailVerified = true; persistData(); }
  async verifyEmailWithToken(t) { return { email: 'user@test.com' }; }
  async sendPhoneVerificationCode(p) { return; }
  async verifyPhoneCode(c) { const u = this._getCurrentUserFromToken(); if(u) u.phoneVerified = true; persistData(); return true; }
  async updateUserPreferences(p) { const u = this._getCurrentUserFromToken(); if(u) u.preferences = p; persistData(); return u; }
  async requestPasswordReset(e) { return { message: 'Enviado' }; }
  async getExchanges() { return exchanges; }
  
  async getChatAndExchangeDetails(id) { 
    const ex = exchanges.find(e => e.id === id);
    const chat = chats.find(c => c.exchangeId === id) || { messages: [] };
    if (ex) {
        return { 
            chat, 
            exchange: { 
                ...ex,
                owner: users.find(u => u.id === ex.ownerId),
                requester: users.find(u => u.id === ex.requesterId),
                allItems: items
            } 
        };
    }
    return { chat: { messages: [] }, exchange: null };
  }

  async banUser(userId, reason = null, details = null) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.isBanned = !user.isBanned;
        persistData();
    }
  }

  async getAdminDashboardStats() { return { totalUsers: users.length, totalItems: items.length, activeExchanges: exchanges.length, flaggedItems: 0, flaggedChats: 0, activeUsers: users.length }; }
  async getAllUsersForAdmin() { return users; }
  async getModerationQueue() { return []; }
  
  async getAdminAuditLogs(params = {}) { 
    return { logs: [], totalPages: 0 }; 
  }
  
  async getAllItemsForAdmin() { return items; }
  
  async adminAdvancedSearchExchanges(params = {}) { 
    return { exchanges: [], totalPages: 0 }; 
  }
  
  async getUserProfile(id) { 
    const u = users.find(u => u.id === id);
    if(u) return { ...u, items: items.filter(i => i.userId === id) };
    return null;
  }
  
  async toggleFollowUser(id) { return { isFollowing: true }; }
  async canEditProfile() { return { canEdit: true, reason: null }; }
  async updateUserProfileData(d) { const u = this._getCurrentUserFromToken(); if(u) Object.assign(u, d); persistData(); return u; }
  async saveFcmToken(t) { return; }
}

export const viewHistoryService = { getHistory: () => [], addItem: (item) => {} };
export const api = new ApiClient();
