
import { ExchangeStatus, ItemCondition } from '../types.ts';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';

// --- LISTA INICIAL DE FILTROS DINÁMICOS ---
const INITIAL_MODERATION_RULES = {
    HARASSMENT: ['puta', 'maricon', 'imbecil', 'subnormal', 'gilipollas', 'estupido', 'mierda', 'basura', 'rata', 'escoria'],
    DRUGS_SLANG: ['coca', 'perico', 'chocolate', 'costo', 'maria', 'yerba', 'nieve', 'gramos', 'pastis', 'merca', 'camello'],
    ILLEGAL_ITEMS: ['arma', 'pistola', 'cuchillo', 'rifle', 'explosivo', 'muni', 'veneno']
};

export const DEFAULT_AVATAR_NEUTRAL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0UwRTAxMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

const generatePlaceholderImage = (text: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA', '#85C1E9', '#F1948A'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    const safeText = text.replace(/[^\w\s]/gi, '').substring(0, 25);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="${bgColor}" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">${safeText}</text>
    </svg>`.trim();
    // Usamos btoa con escape para manejar caracteres especiales si los hubiera
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

let users = [];
let items = [];
let exchanges = [];
let chats = [];
let reportedContent = []; 
let activeFilters = { ...INITIAL_MODERATION_RULES };

const persistData = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('swapit_data', JSON.stringify({ users, items, exchanges, chats, reportedContent, activeFilters }));
    }
};

const setupInitialData = () => {
    try {
        const data = typeof window !== 'undefined' ? window.localStorage.getItem('swapit_data') : null;
        if (data) {
            const parsedData = JSON.parse(data);
            // Si el admin tiene artículos en la cache, forzamos limpieza para cumplir el nuevo requisito
            const adminHasItems = (parsedData.items || []).some(i => i.userId === 'azzazel69');
            if (!adminHasItems && parsedData.users?.length >= 9) {
                users = parsedData.users || [];
                items = parsedData.items || [];
                exchanges = parsedData.exchanges || [];
                chats = parsedData.chats || [];
                reportedContent = parsedData.reportedContent || [];
                activeFilters = parsedData.activeFilters || { ...INITIAL_MODERATION_RULES };
                return;
            }
        }
    } catch (e) {}
    
    users = [
        { id: 'azzazel69', name: 'Admin Supremo', email: 'azzazel69@gmail.com', role: 'SUPER_ADMIN', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Valencia', country: 'España', lat: 39.469, lng: -0.376 }, preferences: ['Seguridad', 'Moderación'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'carlos', name: 'Carlos Pérez', email: 'carlos@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Madrid', country: 'España', lat: 40.416, lng: -3.703 }, preferences: ['Vehículos', 'Bicicletas'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'lucia', name: 'Lucía Fernández', email: 'lucia@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Barcelona', country: 'España', lat: 41.385, lng: 2.173 }, preferences: ['Hogar y Muebles'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'ana', name: 'Ana Martínez', email: 'ana@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Sevilla', country: 'España', lat: 37.389, lng: -5.984 }, preferences: ['Libros', 'Música'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'miguel', name: 'Miguel Ángel', email: 'miguel@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Málaga', country: 'España', lat: 36.721, lng: -4.421 }, preferences: ['Electrónica', 'Móviles'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'elena', name: 'Elena García', email: 'elena@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Zaragoza', country: 'España', lat: 41.648, lng: -0.889 }, preferences: ['Cámaras y Fotografía'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'david', name: 'David Ortiz', email: 'david@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Bilbao', country: 'España', lat: 43.263, lng: -2.935 }, preferences: ['Coleccionismo', 'Figuras de Acción'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'pedro', name: 'Pedro Troll', email: 'pedro_troll@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Madrid', country: 'España', lat: 40.416, lng: -3.703 }, preferences: ['Bbromas', 'Piedras'], contactCard: { enabled: true }, favorites: [], following: [] },
        { id: 'scammer', name: 'Bot Scammer', email: 'scammer@test.com', avatarUrl: DEFAULT_AVATAR_NEUTRAL, emailVerified: true, phoneVerified: true, location: { city: 'Valencia', country: 'España', lat: 39.469, lng: -0.376 }, preferences: ['Estafas', 'Cripto'], contactCard: { enabled: true }, favorites: [], following: [] }
    ];

    const createMockItem = (id, uid, title, cat, cond, wished, desc) => ({
        id, userId: uid, ownerName: users.find(u => u.id === uid).name, ownerAvatarUrl: DEFAULT_AVATAR_NEUTRAL,
        title, category: cat, condition: cond, wishedItem: wished, description: desc,
        imageUrls: [generatePlaceholderImage(title)], status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: Math.floor(Math.random() * 10), flagged: false
    });

    items = [
        // Artículos de Carlos
        createMockItem('it-3', 'carlos', 'Bicicleta MTB Orbea', 'Vehículos', ItemCondition.Good, 'Patinete Xiaomi', 'Talla L, frenos nuevos. Muy bien cuidada.'),
        createMockItem('it-4', 'carlos', 'Casco Moto Shark', 'Vehículos', ItemCondition.LikeNew, 'Guantes Cuero', 'Usado 2 veces, talla M. Como nuevo.'),
        createMockItem('it-17', 'carlos', 'PC Gaming RTX 3060', 'Electrónica', ItemCondition.Good, 'PlayStation 5', 'Corre todo en ultra. 16GB RAM, SSD 1TB.'),
        
        // Artículos de Lucía
        createMockItem('it-5', 'lucia', 'Mesa de Centro Roble', 'Hogar y Muebles', ItemCondition.Good, 'Lámpara de Pie', 'Madera maciza, pesada y de gran calidad.'),
        createMockItem('it-6', 'lucia', 'Set de 4 Sillas', 'Hogar y Muebles', ItemCondition.Acceptable, 'Alfombra grande', 'Estilo nórdico, tienen marcas de uso pero son sólidas.'),
        createMockItem('it-19', 'lucia', 'Aspiradora Dyson V11', 'Hogar y Muebles', ItemCondition.Good, 'Robot Cocina', 'Mucha potencia, incluye todos los accesorios.'),
        
        // Artículos de Ana
        createMockItem('it-7', 'ana', 'Colección Vinilos Rock', 'Libros, Películas y Música', ItemCondition.LikeNew, 'Tocadiscos', '70s y 80s. Queen, Led Zeppelin, Pink Floyd.'),
        createMockItem('it-8', 'ana', 'Libro Dune (Ed. Especial)', 'Libros, Películas y Música', ItemCondition.New, 'Kindle', 'Tapa dura, precintado. Ilustraciones exclusivas.'),
        createMockItem('it-18', 'ana', 'Tocadiscos Sony', 'Electrónica', ItemCondition.Good, 'Colección Vinilos', 'Vintage, funciona perfectamente bien.'),
        
        // Artículos de Miguel
        createMockItem('it-9', 'miguel', 'iPhone 13 Pro Max', 'Electrónica', ItemCondition.Good, 'Samsung S23', 'Batería al 88%. Pantalla siempre con protector.'),
        createMockItem('it-10', 'miguel', 'AirPods Pro 2', 'Electrónica', ItemCondition.LikeNew, 'Reloj Garmin', 'Con caja original y cable de carga. Poco uso.'),
        
        // Artículos de Elena
        createMockItem('it-11', 'elena', 'Cámara Sony A7 III', 'Electrónica', ItemCondition.Good, 'Objetivo 35mm', 'Solo cuerpo. 15.000 disparos. Muy mimada.'),
        createMockItem('it-12', 'elena', 'Trípode Carbono Manfrotto', 'Electrónica', ItemCondition.LikeNew, 'Mochila Cámara', 'Muy ligero y estable. Ideal viajes.'),
        
        // Artículos de David
        createMockItem('it-13', 'david', 'Figura Funko Pop Batman', 'Coleccionismo', ItemCondition.New, 'Funko Joker', 'Exclusivo Comic-Con. Caja en perfecto estado.'),
        createMockItem('it-14', 'david', 'Cartas Pokémon Base Set', 'Coleccionismo', ItemCondition.Acceptable, 'Nintendo 64', 'Lote de 50 cartas antiguas, algunas brillantes.'),

        // ARTÍCULOS DE PEDRO TROLL (Contenido absurdo/molesto)
        createMockItem('it-15', 'pedro', 'Aire de la Montaña (Bote)', 'Otros', ItemCondition.New, 'iPhone 15', 'Aire puro recogido a 2000m de altura. No acepto menos de un iPhone.'),
        createMockItem('it-20', 'pedro', 'Calcetín Desparejado (Mágico)', 'Otros', ItemCondition.Acceptable, 'Coche', 'Me sobró de una mudanza. Dicen que trae suerte.'),

        // ARTÍCULOS DE BOT SCAMMER (Contenido sospechoso/ilegal)
        createMockItem('it-16', 'scammer', 'Rolex Submariner BARATO', 'Otros', ItemCondition.New, 'Solo Crypto', 'Págamo en Bitcoin y te lo envío. Urge mucho la venta por viaje.'),
        createMockItem('it-21', 'scammer', 'iPhone 16 Pro Max (50€)', 'Electrónica', ItemCondition.New, 'Bizum previo', 'Oportunidad única limitada. Solo hoy. Hablar por WhatsApp.')
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

  async register(name, email, password, avatar, location) {
      const existing = users.find(u => u.email === email);
      if (existing) throw new Error('Email ya registrado');
      const newUser = { id: `user-${Date.now()}`, name, email, role: 'USER', avatarUrl: avatar || DEFAULT_AVATAR_NEUTRAL, emailVerified: false, phoneVerified: false, location, preferences: [], favorites: [], following: [], contactCard: { enabled: true } };
      users.push(newUser);
      persistData();
      return newUser;
  }

  async getCurrentUser() {
      const u = this._getCurrentUserFromToken();
      if (!u) throw new Error('No autorizado');
      return u;
  }

  async getModerationFilters() { return activeFilters; }
  async addFilterWord(category, word) {
      if (!activeFilters[category]) activeFilters[category] = [];
      activeFilters[category].push(word.toLowerCase());
      persistData();
  }
  async removeFilterWord(category, word) {
      if (activeFilters[category]) {
          activeFilters[category] = activeFilters[category].filter(w => w !== word);
          persistData();
      }
  }

  async createItem(data) {
      const user = this._getCurrentUserFromToken();
      if (!user) throw new Error('No autorizado');
      const newItem = { 
        id: `item-${Date.now()}`, userId: user.id, ownerName: user.name, ownerAvatarUrl: user.avatarUrl || DEFAULT_AVATAR_NEUTRAL,
        ...data, imageUrls: (data.imageUrls && data.imageUrls.length > 0) ? data.imageUrls : [generatePlaceholderImage(data.title)],
        status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 0, flagged: false 
      };
      items.unshift(newItem);
      persistData();
      return newItem;
  }

  async getItemById(id) { return items.find(i => i.id === id); }
  async getUserItems(uid) { return items.filter(i => i.userId === uid); }
  async updateItem(id, data) {
      const item = items.find(i => i.id === id);
      if (item) { Object.assign(item, data); persistData(); return item; }
      throw new Error('No encontrado');
  }
  async deleteItem(itemId) {
      items = items.filter(i => i.id !== itemId);
      persistData();
  }

  async toggleFavorite(itemId) {
      const user = this._getCurrentUserFromToken();
      if (!user) throw new Error('No autorizado');
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('No encontrado');
      if (!user.favorites) user.favorites = [];
      const idx = user.favorites.indexOf(itemId);
      if (idx === -1) { user.favorites.push(itemId); item.likes++; }
      else { user.favorites.splice(idx, 1); item.likes--; }
      persistData();
      return { ...item, isFavorited: idx === -1 };
  }

  async sendMessage(exchangeId, text) {
    const user = this._getCurrentUserFromToken();
    if (!user) throw new Error('No autorizado');
    let chat = chats.find(c => c.exchangeId === exchangeId);
    if (!chat) { chat = { exchangeId, messages: [] }; chats.push(chat); }
    chat.messages.push({ id: `msg-${Date.now()}`, senderId: user.id, text, timestamp: new Date().toISOString() });
    persistData();
  }

  async getExchanges() { return exchanges; }
  async getChatAndExchangeDetails(id) {
      const ex = exchanges.find(e => e.id === id);
      const chat = chats.find(c => c.exchangeId === id) || { messages: [] };
      return { chat, exchange: ex ? { ...ex, owner: users.find(u => u.id === ex.ownerId), requester: users.find(u => u.id === ex.requesterId) } : null };
  }

  async createExchangeProposal(data) {
      const user = this._getCurrentUserFromToken();
      const requestedItem = items.find(i => i.id === data.requestedItemId);
      const newExchange = { id: `ex-${Date.now()}`, requesterId: user.id, requesterName: user.name, ownerId: requestedItem.userId, ownerName: requestedItem.ownerName, requestedItem, offeredItemIds: data.offeredItemIds, offeredItems: items.filter(i => data.offeredItemIds.includes(i.id)), offeredOtherItems: data.otherItems || [], status: ExchangeStatus.Pending, createdAt: new Date().toISOString() };
      exchanges.push(newExchange);
      persistData();
      return newExchange;
  }

  async deleteExchanges(ids) { exchanges = exchanges.filter(e => !ids.includes(e.id)); persistData(); }
  async updateUserProfileData(data) { const user = this._getCurrentUserFromToken(); if (user) { Object.assign(user, data); persistData(); return user; } throw new Error("No autorizado"); }
  async updateUserPassword(curr, next) { return { message: 'Ok' }; }
  async updateUserColumnLayout(l) { const u = this._getCurrentUserFromToken(); if (u) { u.columnLayout = l; persistData(); } }
  async updateUserPreferences(p) { const u = this._getCurrentUserFromToken(); if (u) { u.preferences = p; persistData(); return u; } throw new Error("No autorizado"); }
  async updateUserLocation(loc) { const u = this._getCurrentUserFromToken(); if (u) { u.location = loc; persistData(); return u; } }
  async getUserProfile(uid) { const u = users.find(u => u.id === uid); if (!u) throw new Error('No encontrado'); return { ...u, items: items.filter(i => i.userId === uid) }; }
  async toggleFollowUser(uid) { 
      const u = this._getCurrentUserFromToken(); 
      if (!u.following) u.following = []; 
      const idx = u.following.indexOf(uid); 
      if (idx === -1) u.following.push(uid); else u.following.splice(idx, 1); 
      persistData(); 
      return { isFollowing: idx === -1 }; 
  }
  async canEditProfile() { return { canEdit: true, reason: null }; }
  async rateUserAndCompleteExchange(id, d) { const ex = exchanges.find(e => e.id === id); if (ex) { ex.status = ExchangeStatus.Completed; persistData(); } }
  async acceptMeetingLocation(id, addr, type) { const ex = exchanges.find(e => e.id === id); if (ex) { ex.acceptedMeetingPoint = addr; persistData(); } }
  async resizeImageBeforeUpload(f) { return new Promise(r => { const reader = new FileReader(); reader.onloadend = () => r(reader.result); reader.readAsDataURL(f); }); }

  async getHomePageData(params = {}) {
      const user = this._getCurrentUserFromToken();
      if (!user) return { exploreItems: [], totalExploreItems: 0, directMatches: [], recommended: [], followedUsersItems: [] };

      const otherItems = items.filter(i => i.userId !== user.id && !i.flagged);
      const myItems = items.filter(i => i.userId === user.id);

      const directMatches = otherItems.filter(otherItem => {
          return myItems.some(myItem => {
              const otherWantsMyItem = otherItem.wishedItem && myItem.title.toLowerCase().includes(otherItem.wishedItem.toLowerCase());
              const iWantOtherItem = myItem.wishedItem && otherItem.title.toLowerCase().includes(myItem.wishedItem.toLowerCase());
              return otherWantsMyItem || iWantOtherItem;
          });
      }).map(i => ({ ...i, isMatch: true, isFavorited: user.favorites?.includes(i.id) }));

      const recommended = otherItems.filter(i => 
          user.preferences?.some(pref => i.category.toLowerCase().includes(pref.toLowerCase()) || i.title.toLowerCase().includes(pref.toLowerCase()))
      ).filter(i => !directMatches.some(dm => dm.id === i.id))
       .map(i => ({ ...i, isFavorited: user.favorites?.includes(i.id) }));

      const followedUsersItems = otherItems.filter(i => user.following?.includes(i.userId))
          .map(i => ({ ...i, isFavorited: user.favorites?.includes(i.id) }));

      const exploreItems = otherItems
          .filter(i => !directMatches.some(dm => dm.id === i.id) && !recommended.some(r => r.id === i.id))
          .map(i => ({ ...i, isFavorited: user.favorites?.includes(i.id) }));

      return { exploreItems, totalExploreItems: exploreItems.length, directMatches, recommended: recommended.slice(0, 8), followedUsersItems };
  }

  async getModerationQueue() { return reportedContent; }
  async resolveModeration(alertId, type, action) {
      const alertIndex = reportedContent.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
          const alert = reportedContent[alertIndex];
          alert.status = action === 'APPROVE' ? 'RESOLVED' : 'ACTION_TAKEN';
          if (action === 'DELETE') {
              if (type === 'ITEM') { items = items.filter(i => i.id !== alert.targetId); }
              else if (type === 'USER') { const user = users.find(u => u.id === alert.targetId); if (user) user.isBanned = true; }
          }
          persistData();
      }
  }

  async reportContent(id, t, r) { 
      const u = this._getCurrentUserFromToken();
      const alert = { id: `rep-${Date.now()}`, type: t, targetId: id, reporterId: u?.id || 'sys', reporterName: u?.name || 'Sistema', reason: r, isAuto: false, date: new Date().toISOString(), status: 'PENDING', preview: 'Reporte de contenido' };
      reportedContent.unshift(alert);
      persistData();
  }
  async verifyEmail() { const u = this._getCurrentUserFromToken(); if (u) { u.emailVerified = true; persistData(); } }
  async sendPhoneVerificationCode(p) { return true; }
  async verifyPhoneCode(c) { const u = this._getCurrentUserFromToken(); if (u && c === '123456') { u.phoneVerified = true; persistData(); return true; } return false; }
  async requestPasswordReset(e) { return { message: 'Enviado' }; }
  async verifyEmailWithToken(t) { return { email: 'test@test.com' }; }

  // Fix: Add missing saveFcmToken method to ApiClient to fix error in pushNotifications.ts
  async saveFcmToken(token: string) {
    const user = this._getCurrentUserFromToken();
    if (user) {
      user.fcmToken = token;
      persistData();
    }
  }
}

export const api = new ApiClient();
export const viewHistoryService = { getHistory: () => [], addItem: (item) => {} };
