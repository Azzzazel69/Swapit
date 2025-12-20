
import { ExchangeStatus, ItemCondition } from '../types.ts';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';

// --- Constants & Config ---
const BAD_WORDS = ['estafa', 'robo', 'arma', 'droga', 'idiota', 'estupida', 'imbecil', 'bizum', 'whatsapp', 'fuera de la app', 'matar', 'muerte', 'sexo', 'desnudo'];
const MAX_ACCOUNTS_PER_PHONE = 3;

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

// --- DEV PATCH: notifications (dev-only) ---
const notificationsStore: Record<string, Array<any>> = {};

function addNotificationDev(userId: string, payload: { title: string; body?: string; meta?: any }) {
  if (!userId) return;
  if (!notificationsStore[userId]) notificationsStore[userId] = [];
  
  // Lógica inteligente: Si es un mensaje de chat, no duplicar si ya hay uno sin leer para ese chat
  if (payload.meta?.type === 'chat') {
      const existing = notificationsStore[userId].find(n => 
          !n.read && 
          n.meta?.type === 'chat' && 
          n.meta?.exchangeId === payload.meta.exchangeId
      );
      if (existing) {
          existing.createdAt = new Date().toISOString(); // Lo movemos arriba
          existing.body = "Tienes mensajes nuevos pendientes."; // Actualizamos cuerpo opcionalmente
          return;
      }
  }

  notificationsStore[userId].unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    title: payload.title,
    body: payload.body || '',
    read: false,
    createdAt: new Date().toISOString(),
    meta: payload.meta || null
  });
  if (notificationsStore[userId].length > 100) notificationsStore[userId].length = 100;
}

async function getNotificationsForUserDev(userId: string) {
  await new Promise(r => setTimeout(r, 40));
  return (notificationsStore[userId] || []).slice(0, 50);
}

async function markAllNotificationsReadDev(userId: string) {
  if (!notificationsStore[userId]) return;
  notificationsStore[userId] = notificationsStore[userId].map(n => ({ ...n, read: true }));
}

async function markChatNotificationsAsReadDev(userId: string, exchangeId: string) {
    if (!notificationsStore[userId]) return;
    notificationsStore[userId] = notificationsStore[userId].map(n => 
        (n.meta?.type === 'chat' && n.meta?.exchangeId === exchangeId) ? { ...n, read: true } : n
    );
}

async function loginWithGoogleMock() {
  await new Promise(r => setTimeout(r, 120));
  const mockUser = users.find(u => u.id === 'user-1') || users[1];
  const token = `fake-jwt-for-${mockUser.id}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('jwt_token', token);
  }
  return { user: mockUser, token };
}

// --- DATA ---
let users = [];
let items = [];
let exchanges = [];
let chats = [];
let itemLogs = [];
let reportedContent = [];

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
    const createUser = (id, name, email, role = 'USER', locationCity = 'Madrid', avatar = DEFAULT_AVATAR_NEUTRAL) => ({
        id, name, email, role, salt: adminSalt,
        hashedPassword: btoa('password123' + adminSalt),
        emailVerified: true, phoneVerified: true, phone: '600000000',
        location: { country: 'España', city: locationCity, postalCode: '28001', address: 'Calle Principal' },
        preferences: ['Electrónica', 'Hogar y Muebles'],
        avatarUrl: avatar, ratings: [], following: [], notificationSettings: { newItemsFromFavorites: true },
        isBanned: false, lastActiveAt: new Date().toISOString(), columnLayout: null
    });

    users = [
        createUser('admin-1', 'Admin Supremo', 'azzazel69@gmail.com', 'SUPER_ADMIN', 'Valencia', DEFAULT_AVATAR_NEUTRAL),
        createUser('user-1', 'Carlos Pérez', 'carlos@test.com', 'USER', 'Madrid', DEFAULT_AVATAR_MALE),
        createUser('user-2', 'Lucía Gómez', 'lucia@test.com', 'USER', 'Barcelona', DEFAULT_AVATAR_FEMALE),
        createUser('user-3', 'Pedro Troll', 'pedro_troll@test.com', 'USER', 'Sevilla', DEFAULT_AVATAR_MALE),
        createUser('user-4', 'Ana M.', 'ana@test.com', 'USER', 'Valencia', DEFAULT_AVATAR_FEMALE),
        createUser('user-7', 'Bot Scammer', 'scammer@test.com', 'USER', 'Madrid', DEFAULT_AVATAR_NEUTRAL),
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

const persistData = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('swapit_data', JSON.stringify({ users, items, exchanges, chats, itemLogs, reportedContent }));
    }
};

setupInitialData();

class ApiClient {
  token = null;

  _getCurrentUserFromToken() {
    if (!this.token) return null;
    const userId = this.token.replace('fake-jwt-for-', '');
    return users.find(u => u.id === userId);
  }

  _enrichItem(item, currentUser, userItemsCache = null) {
      if (!item) return null;
      const owner = users.find(u => u.id === item.userId);
      if (owner?.isBanned) return null;
      const isFavorited = currentUser ? (item.favoritedBy || []).includes(currentUser.id) : false;
      const myItems = userItemsCache || (currentUser ? items.filter(i => i.userId === currentUser.id) : []);
      const isMatch = myItems.some(myI => 
        (myI.wishedItem && item.title.toLowerCase().includes(myI.wishedItem.toLowerCase())) &&
        (item.wishedItem && myI.title.toLowerCase().includes(item.wishedItem.toLowerCase()))
      );
      return { ...item, isFavorited, isMatch, ownerAvatarUrl: owner?.avatarUrl || DEFAULT_AVATAR_NEUTRAL, ownerLocation: owner?.location };
  }

  async simulateDelay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }
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
      return await loginWithGoogleMock();
  }

  async register(name, email, password, gender, avatar) {
      await this.simulateDelay();
      const id = `user-${Date.now()}`;
      const salt = 'salt' + Math.random().toString(36).slice(2, 5);
      const newUser = {
          id, name, email, role: 'USER', salt,
          hashedPassword: btoa(password + salt),
          emailVerified: false, phoneVerified: false, phone: '',
          location: null, preferences: [],
          avatarUrl: avatar || DEFAULT_AVATAR_NEUTRAL, ratings: [], following: [], notificationSettings: { newItemsFromFavorites: true },
          isBanned: false, lastActiveAt: new Date().toISOString(), columnLayout: null
      };
      users.push(newUser);
      persistData();
      return { user: newUser, token: `fake-jwt-for-${id}` };
  }

  async getCurrentUser() {
      const u = this._getCurrentUserFromToken();
      if (!u) throw new Error('No autorizado');
      return { ...u, hashedPassword: null, salt: null };
  }

  async getHomePageData({ page = 1, limit = 12 }) {
      const user = this._getCurrentUserFromToken();
      const myItems = user ? items.filter(i => i.userId === user.id) : [];
      const explore = items.filter(i => !i.flagged && i.status === 'AVAILABLE' && i.userId !== user?.id)
                          .map(i => this._enrichItem(i, user, myItems));
      
      const followedUsersItems = user ? items.filter(i => user.following.includes(i.userId) && !i.flagged && i.status === 'AVAILABLE').map(i => this._enrichItem(i, user, myItems)) : [];

      return { 
          exploreItems: explore.slice((page-1)*limit, page*limit),
          totalExploreItems: explore.length,
          directMatches: explore.filter(i => i.isMatch).slice(0, 4),
          recommended: explore.slice(0, 4),
          followedUsersItems: followedUsersItems.slice(0, 8)
      };
  }

  async getItemById(id) {
      const user = this._getCurrentUserFromToken();
      return this._enrichItem(items.find(i => i.id === id), user);
  }

  async toggleFavorite(id) {
      const user = this._getCurrentUserFromToken();
      const item = items.find(i => i.id === id);
      if (!item || !user) return;
      if (!item.favoritedBy) item.favoritedBy = [];
      const idx = item.favoritedBy.indexOf(user.id);
      if (idx > -1) {
          item.favoritedBy.splice(idx, 1);
          item.likes = Math.max(0, (item.likes || 0) - 1);
      } else {
          item.favoritedBy.push(user.id);
          item.likes = (item.likes || 0) + 1;
          addNotificationDev(item.userId, {
              title: '¡Le gusta tu artículo!',
              body: `${user.name} guardó "${item.title}" en favoritos.`,
              meta: { type: 'favorite', userId: user.id }
          });
      }
      persistData();
      return this._enrichItem(item, user);
  }

  async createExchangeProposal(p) {
      const user = this._getCurrentUserFromToken();
      const target = items.find(i => i.id === p.requestedItemId);
      const exId = `ex-${Date.now()}`;
      const newEx = {
          id: exId, requesterId: user.id, requesterName: user.name,
          ownerId: target.userId, ownerName: target.ownerName,
          status: 'PENDING', requestedItemId: p.requestedItemId, offeredItemIds: p.offeredItemIds,
          offeredOtherItems: p.otherItems || [], createdAt: new Date().toISOString()
      };
      exchanges.push(newEx);
      chats.push({
          id: exId, participantIds: [user.id, target.userId],
          messages: p.message ? [{ id: 'm1', senderId: user.id, text: p.message, timestamp: new Date().toISOString() }] : []
      });
      addNotificationDev(target.userId, {
          title: '¡Nueva propuesta de cambio!',
          body: `${user.name} quiere tu ${target.title}.`,
          meta: { exchangeId: exId, type: 'proposal' }
      });
      persistData();
      return newEx;
  }

  async modifyExchangeProposal(exId, data) {
      const ex = exchanges.find(e => e.id === exId);
      if (!ex) throw new Error('Intercambio no encontrado');
      ex.offeredItemIds = data.offeredItemIds;
      ex.offeredOtherItems = data.otherItems || [];
      persistData();
      return ex;
  }

  async sendMessage(chatId, text) {
      const user = this._getCurrentUserFromToken();
      const chat = chats.find(c => c.id === chatId);
      const msg = { id: `m-${Date.now()}`, senderId: user.id, text, timestamp: new Date().toISOString(), type: 'TEXT' };
      chat.messages.push(msg);
      const recipientId = chat.participantIds.find(id => id !== user.id);
      
      // Enviamos la notificación agrupada
      addNotificationDev(recipientId, {
          title: `Mensaje de ${user.name}`,
          body: text,
          meta: { exchangeId: chatId, type: 'chat' }
      });
      
      persistData();
      return msg;
  }

  async censorMessage(exId, msgId) {
      const chat = chats.find(c => c.id === exId);
      const msg = chat.messages.find(m => m.id === msgId);
      if (msg) {
          msg.text = "[CONTENIDO ELIMINADO POR MODERACIÓN]";
          persistData();
      }
  }

  async respondToExchange(exId, action) {
      const ex = exchanges.find(e => e.id === exId);
      const user = this._getCurrentUserFromToken();
      if (action === 'ACCEPT') {
          ex.status = 'ACCEPTED';
          ex.acceptedAt = new Date().toISOString(); 
          addNotificationDev(ex.requesterId, {
              title: '¡Propuesta Aceptada!',
              body: `${user.name} ha aceptado tu propuesta de trueque.`,
              meta: { exchangeId: exId, type: 'status' }
          });
      } else if (action === 'REJECT') {
          ex.status = 'REJECTED';
          addNotificationDev(ex.requesterId, {
              title: 'Propuesta rechazada',
              body: `${user.name} no está interesado en el cambio.`,
              meta: { exchangeId: exId, type: 'status' }
          });
      }
      persistData();
  }

  async addCounterOffer(exId, itemIds) {
      const ex = exchanges.find(e => e.id === exId);
      const user = this._getCurrentUserFromToken();
      ex.offeredItemIds = [...new Set([...ex.offeredItemIds, ...itemIds])];
      const recipientId = (user.id === ex.ownerId) ? ex.requesterId : ex.ownerId;
      addNotificationDev(recipientId, {
          title: 'Nueva contraoferta',
          body: `${user.name} ha añadido artículos a la propuesta.`,
          meta: { exchangeId: exId, type: 'proposal' }
      });
      persistData();
  }

  async rateUserAndCompleteExchange(exId, ratingData) {
      const ex = exchanges.find(e => e.id === exId);
      const user = this._getCurrentUserFromToken();
      ex.status = 'COMPLETED';
      const targetUserId = (user.id === ex.ownerId) ? ex.requesterId : ex.ownerId;
      const targetUser = users.find(u => u.id === targetUserId);
      targetUser.ratings.push({ ...ratingData, from: user.name, date: new Date().toISOString() });
      addNotificationDev(targetUserId, {
          title: '¡Intercambio Completado!',
          body: `${user.name} te ha valorado con ${ratingData.rating} estrellas.`,
          meta: { type: 'rating' }
      });
      persistData();
  }

  async getChatAndExchangeDetails(id) {
      const user = this._getCurrentUserFromToken();
      const chat = chats.find(c => c.id === id);
      const ex = exchanges.find(e => e.id === id);
      if (!ex) return { chat: null, exchange: null };
      const owner = users.find(u => u.id === ex.ownerId);
      const req = users.find(u => u.id === ex.requesterId);
      const allItemIds = [ex.requestedItemId, ...ex.offeredItemIds];
      const detailedEx = { ...ex, allItems: items.filter(i => allItemIds.includes(i.id)), owner, requester: req };
      return { chat, exchange: detailedEx };
  }

  async getExchanges() {
      const user = this._getCurrentUserFromToken();
      if (!user) return [];
      return exchanges.filter(ex => ex.ownerId === user.id || ex.requesterId === user.id).map(ex => ({
          ...ex,
          requestedItem: items.find(i => i.id === ex.requestedItemId) || { title: 'Eliminado' },
          offeredItems: ex.offeredItemIds.map(id => items.find(i => i.id === id)).filter(Boolean)
      }));
  }

  async getUserItems(uid) { return items.filter(i => i.userId === uid).map(i => this._enrichItem(i, this._getCurrentUserFromToken())); }
  async getFavoriteItems() {
      const user = this._getCurrentUserFromToken();
      return items.filter(i => (i.favoritedBy || []).includes(user?.id)).map(i => this._enrichItem(i, user));
  }
  async createItem(data) {
      const user = this._getCurrentUserFromToken();
      const newItem = { id: `item-${Date.now()}`, userId: user.id, ownerName: user.name, ...data, status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 0, favoritedBy: [], modificationCount: 0, lastModifiedAt: new Date().toISOString(), flagged: false };
      items.unshift(newItem);
      persistData();
      return newItem;
  }
  
  async updateItem(itemId, data) {
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('Item no encontrado');
      Object.assign(item, data);
      item.modificationCount = (item.modificationCount || 0) + 1;
      item.lastModifiedAt = new Date().toISOString();
      persistData();
      return this._enrichItem(item, this._getCurrentUserFromToken());
  }

  async deleteItem(itemId) {
      const index = items.findIndex(i => i.id === itemId);
      if (index > -1) {
          items.splice(index, 1);
          persistData();
      }
  }

  async getUserProfile(userId) {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('Usuario no encontrado');
      const userItems = items.filter(i => i.userId === userId);
      const enrichedItems = userItems.map(i => this._enrichItem(i, this._getCurrentUserFromToken()));
      return { ...user, items: enrichedItems, hashedPassword: null, salt: null };
  }

  async banUser(id, r, d) {
      const u = users.find(u => u.id === id);
      u.isBanned = !u.isBanned;
      persistData();
      return { success: true };
  }
  async getAdminDashboardStats() {
      return { totalUsers: users.length, totalItems: items.length, activeExchanges: exchanges.length, flaggedItems: reportedContent.filter(r => r.contentType === 'ITEM').length, flaggedChats: reportedContent.filter(r => r.contentType === 'CHAT').length, activeUsers: users.length };
  }
  async getAllUsersForAdmin() { return users; }
  
  async getModerationQueue() {
      return reportedContent.map(r => ({
          ...r,
          preview: r.contentType === 'ITEM' ? (items.find(i => i.id === r.contentId)?.title || 'Item eliminado') : 'Conversación reportada',
          date: r.createdAt
      }));
  }

  async resolveModeration(id, type, action) {
      const index = reportedContent.findIndex(r => r.id === id);
      if (index > -1) {
          if (action === 'DELETE') {
              const contentId = reportedContent[index].contentId;
              if (type === 'ITEM') await this.deleteItem(contentId);
          }
          reportedContent.splice(index, 1);
          persistData();
      }
  }

  async getAdminAuditLogs({ query = '', page = 1, limit = 20 } = {}) {
      return { logs: [], totalPages: 0 };
  }

  async getAllItemsForAdmin() { return items; }
  
  async deleteItemByAdmin(itemId) {
      await this.deleteItem(itemId);
  }

  async adminAdvancedSearchExchanges({ query = '', status = 'ALL', page = 1, limit = 10 } = {}) {
      return { exchanges: [], totalPages: 0 };
  }

  async toggleFollowUser(id) {
      const user = this._getCurrentUserFromToken();
      if (!user) throw new Error('No autorizado');
      if (!user.following) user.following = [];
      const idx = user.following.indexOf(id);
      let isFollowing = false;
      if (idx > -1) {
          user.following.splice(idx, 1);
      } else {
          user.following.push(id);
          isFollowing = true;
      }
      persistData();
      return { isFollowing };
  }

  async canEditProfile() { return { canEdit: true }; }
  async resizeImageBeforeUpload(f) { return URL.createObjectURL(f); }
  async deleteExchanges(ids) { exchanges = exchanges.filter(e => !ids.includes(e.id)); persistData(); }

  async updateUserAvatar(avatarUrl) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.avatarUrl = avatarUrl;
          persistData();
      }
  }

  async updateUserProfileData(data) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          Object.assign(user, data);
          persistData();
          return user;
      }
      throw new Error('No autorizado');
  }

  async updateUserPassword(current, newP) {
      const user = this._getCurrentUserFromToken();
      if (user && user.hashedPassword === btoa(current + user.salt)) {
          user.hashedPassword = btoa(newP + user.salt);
          persistData();
          return;
      }
      throw new Error('Contraseña actual incorrecta');
  }

  async changeUserPhone(phone) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.phone = phone;
          persistData();
      }
  }

  async verifyPhoneCode(code) {
      if (code === '123456') {
          const user = this._getCurrentUserFromToken();
          if (user) {
              user.phoneVerified = true;
              persistData();
              return true;
          }
      }
      return false;
  }

  async sendPhoneVerificationCode(phone) {
      await this.simulateDelay();
  }

  async updateUserPreferences(prefs) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.preferences = prefs;
          persistData();
          return user;
      }
      throw new Error('No autorizado');
  }

  async updateNotificationSettings(settings) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.notificationSettings = settings;
          persistData();
          return user;
      }
      throw new Error('No autorizado');
  }

  async reportContent(id, type, reason) {
      reportedContent.push({
          id: `rep-${Date.now()}`,
          contentId: id,
          contentType: type,
          reason,
          createdAt: new Date().toISOString()
      });
      persistData();
  }

  async requestPasswordReset(email) {
      await this.simulateDelay();
      return { message: 'Se ha enviado un enlace a tu correo.' };
  }

  async verifyEmail() {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.emailVerified = true;
          persistData();
      }
  }

  async verifyEmailWithToken(token) {
      await this.simulateDelay();
      return { email: 'user@test.com' };
  }

  async updateUserLocation(location) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.location = location;
          persistData();
      }
  }

  async saveFcmToken(token) {
      await this.simulateDelay();
  }

  async updateUserColumnLayout(newLayout) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          user.columnLayout = newLayout;
          persistData();
      }
  }
  
  // Limpia las notificaciones de chat de un intercambio específico
  async markChatAsRead(exchangeId) {
      const user = this._getCurrentUserFromToken();
      if (user) {
          await markChatNotificationsAsReadDev(user.id, exchangeId);
          persistData();
      }
  }
}

export const viewHistoryService = { getHistory: () => [], addItem: (item) => {} };
export const api = new ApiClient();
// @ts-ignore
api.getNotificationsForUserDev = getNotificationsForUserDev;
// @ts-ignore
api.markAllNotificationsReadDev = markAllNotificationsReadDev;
// @ts-ignore
api.loginWithGoogleMock = loginWithGoogleMock;
