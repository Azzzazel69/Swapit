
import { ExchangeStatus, ItemCondition } from '../types.ts';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INITIAL_MODERATION_RULES = {
    HARASSMENT: ['puta', 'maricon', 'imbecil', 'subnormal', 'gilipollas', 'estupido', 'mierda', 'basura', 'rata', 'escoria'],
    DRUGS_SLANG: ['coca', 'perico', 'chocolate', 'costo', 'maria', 'yerba', 'nieve', 'gramos', 'pastis', 'merca', 'camello'],
    ILLEGAL_ITEMS: ['arma', 'pistola', 'cuchillo', 'daga', 'punyal', 'rifle', 'explosivo', 'muni', 'veneno', 'fusil', 'escopeta', 'revolver']
};

export const DEFAULT_AVATAR_NEUTRAL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0UwRTAxMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

const normalize = (text: string) => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

const isSimilar = (s1: string, s2: string): boolean => {
    if (!s1 || !s2) return false;
    const n1 = normalize(s1);
    const n2 = normalize(s2);
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    const editDistance = (a: string, b: string) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
                else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
        return matrix[b.length][a.length];
    };
    const dist = editDistance(n1, n2);
    const threshold = Math.floor(Math.max(n1.length, n2.length) * 0.4);
    return dist <= threshold;
};

const generatePlaceholderImage = (text: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA', '#85C1E9', '#F1948A'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bgColor}" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">${text.substring(0,20)}</text></svg>`.trim();
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

let users = [];
let items = [];
let exchanges = [];
let chats = [];
let reportedContent = []; 
let activeFilters = { ...INITIAL_MODERATION_RULES };
let moderationLogs = [];

const persistData = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('swapit_data', JSON.stringify({ users, items, exchanges, chats, reportedContent, activeFilters, moderationLogs }));
    }
};

const setupInitialData = () => {
    try {
        const data = typeof window !== 'undefined' ? window.localStorage.getItem('swapit_data') : null;
        if (data) {
            const parsedData = JSON.parse(data);
            users = parsedData.users || [];
            if (users.length >= 9) {
                items = parsedData.items || [];
                exchanges = parsedData.exchanges || [];
                chats = parsedData.chats || [];
                reportedContent = parsedData.reportedContent || [];
                activeFilters = parsedData.activeFilters || { ...INITIAL_MODERATION_RULES };
                moderationLogs = parsedData.moderationLogs || [];
                return;
            }
        }
    } catch (e) {}
    
    users = [
        { id: 'azzazel69', name: 'Admin Supremo', email: 'azzazel69@gmail.com', role: 'SUPER_ADMIN', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Valencia', province: 'Valencia', country: 'España', lat: 39.469, lng: -0.376 }, preferences: ['Seguridad'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'carlos', name: 'Carlos Pérez', email: 'carlos@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Madrid', province: 'Madrid', country: 'España', lat: 40.416, lng: -3.703 }, preferences: ['Herramientas', 'Bicicletas'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'lucia', name: 'Lucía Fernández', email: 'lucia@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Barcelona', province: 'Barcelona', country: 'España', lat: 41.385, lng: 2.173 }, preferences: ['Muebles', 'Decoración'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'ana', name: 'Ana Martínez', email: 'ana@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Sevilla', province: 'Sevilla', country: 'España', lat: 37.389, lng: -5.984 }, preferences: ['Libros', 'Música (CDs, Vinilos)'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'miguel', name: 'Miguel Ángel', email: 'miguel@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Málaga', province: 'Málaga', country: 'España', lat: 36.721, lng: -4.421 }, preferences: ['Móviles y Accesorios', 'Consolas y Videojuegos'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'elena', name: 'Elena García', email: 'elena@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Zaragoza', province: 'Zaragoza', country: 'España', lat: 41.648, lng: -0.889 }, preferences: ['Tratamientos Estéticos', 'Yoga'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'david', name: 'David Ortiz', email: 'david@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Bilbao', province: 'Vizcaya', country: 'España', lat: 43.263, lng: -2.935 }, preferences: ['Figuras de Acción', 'Cómics y Manga'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'pedro', name: 'Pedro Troll', email: 'pedro_troll@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Madrid', province: 'Madrid', country: 'España', lat: 40.416, lng: -3.703 }, preferences: ['Bromas'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'scammer', name: 'Bot Scammer', email: 'scammer@test.com', role: 'USER', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Valencia', province: 'Valencia', country: 'España', lat: 39.469, lng: -0.376 }, preferences: ['Inversiones'], contactCard: { enabled: true }, favorites: [], following: [] }
    ];

    const createMockItem = (id, uid, title, cat, cond, wished, desc, status = 'APPROVED', likes = 0, dateOffset = 0) => {
        const date = new Date();
        date.setDate(date.getDate() - dateOffset);
        return {
            id, userId: uid, title, category: cat, condition: cond, wishedItem: wished, description: desc,
            imageUrls: [generatePlaceholderImage(title)], status: status === 'APPROVED' ? 'AVAILABLE' : 'HIDDEN', 
            moderationStatus: status, createdAt: date.toISOString(), likes: likes || Math.floor(Math.random() * 5), flagged: status === 'REJECTED'
        };
    };

    items = [
        createMockItem('it-c1', 'carlos', 'Taladro Bosch Professional', 'Herramientas', ItemCondition.LikeNew, 'Sofá de salón', 'Muy poco uso, con maletín.', 'APPROVED', 12, 1),
        createMockItem('it-l1', 'lucia', 'Sofá 3 plazas Gris', 'Muebles', ItemCondition.Good, 'Taladro percutor', 'Cómodo y en buen estado.', 'APPROVED', 15, 2),
        createMockItem('it-c2', 'carlos', 'Bicicleta de Carretera', 'Vehículos', ItemCondition.Good, 'Patinete', 'Talla M.', 'APPROVED', 8, 3),
        createMockItem('it-a1', 'ana', 'Libro Coleccionista HP', 'Libros', ItemCondition.New, 'Vinilos', 'Edición especial.', 'APPROVED', 22, 0),
        createMockItem('it-m1', 'miguel', 'iPhone 14 Pro', 'Electrónica', ItemCondition.LikeNew, 'MacBook', 'Batería 100%.', 'APPROVED', 30, 1),
        createMockItem('it-adm1', 'azzazel69', 'Monitor 27" 4K', 'Electrónica', ItemCondition.New, 'GPU', 'Para diseño.', 'APPROVED', 10, 4)
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

  _enrichItemWithUserData(item) {
      if (!item) return null;
      const owner = users.find(u => u.id === item.userId);
      return {
          ...item,
          ownerName: owner?.name || 'Swapper Desconocido',
          ownerAvatarUrl: owner?.avatarUrl || DEFAULT_AVATAR_NEUTRAL,
          ownerLocation: owner?.location || { city: 'Desconocido', province: 'Desconocida' },
          ownerRole: owner?.role || 'USER'
      };
  }

  setToken(t) { this.token = t; }

  async login(email, password) {
      const u = users.find(u => u.email === email);
      if (!u) throw new Error('Usuario no encontrado');
      this.token = `fake-jwt-for-${u.id}`;
      return { token: this.token };
  }

  async loginWithGoogle(credential) {
      const u = users[0];
      this.token = `fake-jwt-for-${u.id}`;
      return { token: this.token };
  }

  async loginWithGoogleMock() {
      const u = users[0];
      this.token = `fake-jwt-for-${u.id}`;
      return { token: this.token };
  }

  async getCurrentUser() {
      const u = this._getCurrentUserFromToken();
      if (!u) throw new Error('No autorizado');
      return u;
  }

  async register(name, email, password, avatarUrl, location) {
    if (users.find(u => u.email === email)) throw new Error('Ya existe un usuario con este correo');
    const newUser = { 
        id: `user-${Date.now()}`, name, email, role: 'USER', avatarUrl: avatarUrl || DEFAULT_AVATAR_NEUTRAL, 
        emailVerified: false, phoneVerified: false, location, preferences: [], favorites: [], following: [],
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    persistData();
    return newUser;
  }

  async createItem(data) {
      const user = this._getCurrentUserFromToken();
      if (!user) throw new Error('No autorizado');
      const newItem = { id: `item-${Date.now()}`, userId: user.id, ...data, imageUrls: (data.imageUrls?.length > 0) ? data.imageUrls : [generatePlaceholderImage(data.title)], status: 'AVAILABLE', moderationStatus: 'PENDING', createdAt: new Date().toISOString(), likes: 0, flagged: false };
      items.unshift(newItem);
      persistData();
      return this._enrichItemWithUserData(newItem);
  }

  async updateItem(itemId, data) {
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('Artículo no encontrado');
      Object.assign(item, data);
      persistData();
      return this._enrichItemWithUserData(item);
  }

  async deleteItem(itemId) {
      const idx = items.findIndex(i => i.id === itemId);
      if (idx !== -1) { items.splice(idx, 1); persistData(); }
  }

  async getItemById(id) { 
      const item = items.find(i => i.id === id); 
      return item ? this._enrichItemWithUserData(item) : null; 
  }
  
  async getUserItems(uid) { 
      return items.filter(i => i.userId === uid).map(i => this._enrichItemWithUserData(i)); 
  }

  async getHomePageData(params: { page?: number; limit?: number; viewMode?: string } = {}) {
      const { page = 1, limit = 12 } = params;
      const user = this._getCurrentUserFromToken();
      
      const baseItems = items.filter(i => i.moderationStatus === 'APPROVED' && i.status === 'AVAILABLE');
      const otherItems = user ? baseItems.filter(i => i.userId !== user.id) : baseItems;
      const myItems = user ? items.filter(i => i.userId === user.id) : [];
      
      const directMatches = user ? otherItems.filter(otherItem => {
          return myItems.some(myItem => {
              const otherWantsMyItem = otherItem.wishedItem && isSimilar(myItem.title, otherItem.wishedItem);
              const iWantOtherItem = myItem.wishedItem && isSimilar(otherItem.title, myItem.wishedItem);
              return otherWantsMyItem && iWantOtherItem;
          });
      }).map(i => ({ ...this._enrichItemWithUserData(i), isMatch: true, isFavorited: user.favorites?.includes(i.id) })) : [];

      const recommended = user ? otherItems.filter(i => 
          user.preferences?.some(pref => (i.category || '').toLowerCase().includes((pref || '').toLowerCase()) || isSimilar(i.title, pref))
      ).filter(i => !directMatches.some(dm => dm.id === i.id)).map(i => ({ ...this._enrichItemWithUserData(i), isFavorited: user.favorites?.includes(i.id) })) : [];

      const nearItems = user ? otherItems.filter(i => {
          const owner = users.find(u => u.id === i.userId);
          return owner?.location?.province === user.location?.province;
      }).filter(i => !directMatches.some(dm => dm.id === i.id) && !recommended.some(r => r.id === i.id))
        .map(i => ({ ...this._enrichItemWithUserData(i), isFavorited: user.favorites?.includes(i.id) })) : [];

      const popularItems = [...otherItems].sort((a,b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10).map(i => ({ ...this._enrichItemWithUserData(i), isFavorited: user?.favorites?.includes(i.id) }));
      const favoriteItems = user ? otherItems.filter(i => user.favorites?.includes(i.id)).map(i => ({ ...this._enrichItemWithUserData(i), isFavorited: true })) : [];
      let exploreItems = [...otherItems].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(i => ({ ...this._enrichItemWithUserData(i), isFavorited: user?.favorites?.includes(i.id) }));

      const start = (page - 1) * limit;
      return { exploreItems: exploreItems.slice(start, start + limit), totalExploreItems: exploreItems.length, directMatches, recommended, nearItems, favoriteItems, popularItems };
  }

  async toggleFavorite(itemId) {
    const user = this._getCurrentUserFromToken();
    if (!user) throw new Error("Debes iniciar sesión");
    const item = items.find(i => i.id === itemId);
    if (!user.favorites) user.favorites = [];
    const idx = user.favorites.indexOf(itemId);
    if (idx === -1) { user.favorites.push(itemId); item.likes = (item.likes || 0) + 1; }
    else { user.favorites.splice(idx, 1); item.likes = Math.max(0, (item.likes || 0) - 1); }
    persistData();
    return { ...this._enrichItemWithUserData(item), isFavorited: idx === -1 };
  }

  async getChatAndExchangeDetails(id) { 
      const ex = exchanges.find(e => e.id === id); 
      if (!ex) throw new Error('Intercambio no encontrado');
      const chat = chats.find(c => c.exchangeId === id) || { messages: [] }; 
      const owner = users.find(u => u.id === ex.ownerId);
      const requester = users.find(u => u.id === ex.requesterId);
      const item = items.find(i => i.id === ex.requestedItemId);
      return { chat, exchange: { ...ex, owner, requester, requestedItem: this._enrichItemWithUserData(item) } }; 
  }

  async getExchanges() { return exchanges.map(ex => ({ ...ex, owner: users.find(u => u.id === ex.ownerId), requester: users.find(u => u.id === ex.requesterId), requestedItem: this._enrichItemWithUserData(items.find(i => i.id === ex.requestedItemId)) })); }
  async deleteExchanges(selectedIds) { exchanges = exchanges.filter(ex => !selectedIds.includes(ex.id)); persistData(); }
  async sendMessage(exchangeId, text) {
      const user = this._getCurrentUserFromToken();
      let chat = chats.find(c => c.exchangeId === exchangeId);
      if (!chat) { chat = { exchangeId, messages: [] }; chats.push(chat); }
      chat.messages.push({ id: `msg-${Date.now()}`, senderId: user.id, text, timestamp: new Date().toISOString() });
      persistData();
  }

  async toggleFollowUser(uid) { const u = this._getCurrentUserFromToken(); if (!u.following) u.following = []; const idx = u.following.indexOf(uid); if (idx === -1) u.following.push(uid); else u.following.splice(idx, 1); persistData(); return { isFollowing: idx === -1 }; }
  async getUserProfile(uid) { const u = users.find(u => u.id === uid); return { ...u, items: items.filter(i => i.userId === uid).map(i => this._enrichItemWithUserData(i)) }; }
  async updateUserProfileData(data) { const u = this._getCurrentUserFromToken(); Object.assign(u, data); persistData(); return u; }
  async updateUserPreferences(prefs) { const u = this._getCurrentUserFromToken(); u.preferences = prefs; persistData(); return u; }
  async verifyEmail() { const u = this._getCurrentUserFromToken(); if (u) { u.emailVerified = true; persistData(); } }
  async verifyPhoneCode(code) { if (code === '123456') { const u = this._getCurrentUserFromToken(); if (u) { u.phoneVerified = true; persistData(); } return true; } return false; }
  async reportContent(id, type, reason) { reportedContent.push({ id: `rep-${Date.now()}`, contentId: id, type, reason, date: new Date().toISOString() }); persistData(); }
  async getModerationQueue() { return reportedContent; }
  async getAdminStats() { return { totalUsers: users.length, totalItems: items.length, totalExchanges: exchanges.length, pendingAlerts: reportedContent.length }; }
  async getAllUsersAdmin() { return users; }
  async resolveModeration(id, type, action) { reportedContent = reportedContent.filter(r => r.id !== id); persistData(); }
  async resizeImageBeforeUpload(file) { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file); }); }
  async acceptMeetingLocation(id, address, type) { const ex = exchanges.find(e => e.id === id); if (ex) { (ex as any).acceptedMeetingPoint = address; persistData(); } }
  async updateUserLocation(loc) { const u = this._getCurrentUserFromToken(); if (u) { u.location = loc; persistData(); return u; } }
  async canEditProfile() { return { canEdit: true, reason: null }; }
  async updateUserPassword(currentPassword, newPassword) { return { success: true }; }
  async createExchangeProposal(data) {
      const user = this._getCurrentUserFromToken();
      if (!user) throw new Error('No autorizado');
      const targetItem = items.find(i => i.id === data.requestedItemId);
      if (!targetItem) throw new Error('Artículo no encontrado');
      const newExchange = {
          id: `ex-${Date.now()}`, ownerId: targetItem.userId, requesterId: user.id, requestedItemId: data.requestedItemId,
          offeredItemIds: data.offeredItemIds, offeredOtherItems: data.otherItems || [], status: ExchangeStatus.Pending,
          createdAt: new Date().toISOString(), ownerName: users.find(u => u.id === targetItem.userId)?.name, requesterName: user.name
      };
      exchanges.push(newExchange);
      chats.push({ exchangeId: newExchange.id, messages: [{ id: `msg-sys-${Date.now()}`, senderId: 'system', type: 'SYSTEM', text: data.message || `¡Hola! ${user.name} ha propuesto un intercambio.`, timestamp: new Date().toISOString() }] });
      persistData();
      return newExchange;
  }
  async requestPasswordReset(email) { const u = users.find(u => u.email === email); if (!u) throw new Error('Correo no registrado'); return { message: 'Se ha enviado un correo a ' + email }; }
  async sendPhoneVerificationCode(phone) { return { success: true }; }
  async banUser(userId, reason) { const admin = this._getCurrentUserFromToken(); const user = users.find(u => u.id === userId); if (user) { user.isBanned = true; user.banReason = reason; moderationLogs.unshift({ id: `log-${Date.now()}`, adminName: admin?.name || 'Sistema', action: 'BAN', targetId: userId, details: reason, timestamp: new Date().toISOString() }); persistData(); } }
  async unbanUser(userId) { const admin = this._getCurrentUserFromToken(); const user = users.find(u => u.id === userId); if (user) { user.isBanned = false; user.banReason = null; moderationLogs.unshift({ id: `log-${Date.now()}`, adminName: admin?.name || 'Sistema', action: 'UNBAN', targetId: userId, details: 'Reactivación', timestamp: new Date().toISOString() }); persistData(); } }
  async openDirectAdminChat(userId) {
      const user = users.find(u => u.id === userId);
      const exId = `adm-chat-${userId}`;
      if (!exchanges.find(e => e.id === exId)) {
          exchanges.push({ id: exId, ownerId: 'azzazel69', requesterId: userId, status: ExchangeStatus.Pending, createdAt: new Date().toISOString(), ownerName: 'Admin Supremo', requesterName: user?.name || 'Usuario', requestedItemId: 'it-adm1' });
          chats.push({ exchangeId: exId, messages: [{ id: `msg-adm-${Date.now()}`, senderId: 'azzazel69', text: 'Canal oficial de moderación. ¿En qué podemos ayudarte?', timestamp: new Date().toISOString() }] });
          persistData();
      }
      return exId;
  }
  async saveFcmToken(token) { const u = this._getCurrentUserFromToken(); if (u) { u.fcmToken = token; persistData(); } }
  async getModerationLogs() { return moderationLogs; }
  async assignRole(userId, newRole) { const admin = this._getCurrentUserFromToken(); const user = users.find(u => u.id === userId); if (user) { const oldRole = user.role; user.role = newRole; moderationLogs.unshift({ id: `log-${Date.now()}`, adminName: admin?.name || 'Sistema', action: 'ROLE_CHANGE', targetId: userId, details: `De ${oldRole} a ${newRole}`, timestamp: new Date().toISOString() }); persistData(); } }
  async verifyEmailWithToken(token) { const user = users.find(u => u.email === 'azzazel69@gmail.com'); if (user) { user.emailVerified = true; persistData(); return { email: user.email }; } throw new Error('Token inválido'); }
  async rateUserAndCompleteExchange(exchangeId, ratingData) {
      const ex = exchanges.find(e => e.id === exchangeId);
      if (ex) {
          ex.status = ExchangeStatus.Completed;
          const targetUserId = this._getCurrentUserFromToken()?.id === ex.ownerId ? ex.requesterId : ex.ownerId;
          const targetUser = users.find(u => u.id === targetUserId);
          if (targetUser) { if (!targetUser.ratings) targetUser.ratings = []; targetUser.ratings.push({ rating: ratingData.rating, comment: ratingData.comment, date: new Date().toISOString() }); }
          persistData();
      }
  }
  async getNotificationsForUserDev(uid) { return []; }
  async markAllNotificationsReadDev(uid) { return; }
}

export const api = new ApiClient();
export const viewHistoryService = { getHistory: () => [], addItem: (item) => {} };
