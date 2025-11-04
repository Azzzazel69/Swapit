
import { ExchangeStatus } from '../types.ts';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';

// --- DEV PATCH: polyfills y notifications (dev-only) ---

// Polyfill seguro para atob en entornos node/controlados
if (typeof globalThis.atob === 'undefined') {
  // @ts-ignore
  globalThis.atob = (s: string) => Buffer.from(s, 'base64').toString('binary');
}

// In-memory notifications store (dev-only)
const notificationsStore: Record<string, Array<any>> = {};
// In-memory store for notification cooldowns
// Structure: { ownerId: { favoriterId: timestamp } }
const favoriteNotificationCooldowns = {};

// Añadir notificación
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
  // Mantener lista razonable
  if (notificationsStore[userId].length > 200) notificationsStore[userId].length = 200;
}

// Obtener notificaciones (simula pequeño delay)
async function getNotificationsForUserDev(userId: string) {
  await new Promise(r => setTimeout(r, 40));
  return (notificationsStore[userId] || []).slice(0, 50);
}

async function markAllNotificationsReadDev(userId: string) {
  if (!notificationsStore[userId]) return;
  notificationsStore[userId] = notificationsStore[userId].map(n => ({ ...n, read: true }));
}

// Mock login con Google (dev-only)
async function loginWithGoogleMock() {
  await new Promise(r => setTimeout(r, 120));
  const mockUser = { id: 'google-mock-1', name: 'Google Dev Mock', email: 'google.mock@example.com', emailVerified: true, phoneVerified: true, location: { country: 'España', city: 'Madrid', postalCode: '28013', address: 'Plaza Mayor, 1' }, preferences: ['Libros', 'Música', 'Hogar'] };
  const token = 'mock-jwt-google-mock-1';
  
  const hasLocal = typeof window !== 'undefined' && window.localStorage;
  if (hasLocal) {
    window.localStorage.setItem('jwt_token', token);
  }
  
  return { user: mockUser, token };
}

// --- FIN PATCH ---


// --- START MOCK HASHING (FOR DEMO PURPOSES ONLY) ---
// WARNING: This is a simplified simulation of password hashing for demonstration.
// DO NOT use this implementation in a production environment.
// A real backend should use a strong, slow hashing algorithm like Argon2 or bcrypt.

const generateSalt = (length = 16) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const hashPassword = (password, salt) => {
    // Simple combination and encoding to simulate a hash.
    // In a real app, this would be a one-way cryptographic hash function.
    try {
        // btoa is a simple way to simulate a one-way-like transformation in this mock env.
        return btoa(password + salt);
    } catch (e) {
        // Fallback for environments where btoa might not be available
        return password + salt;
    }
};

// --- END MOCK HASHING ---


let users = [];
let items = [];
let exchanges = [];
let chats = [];

const setupInitialData = () => {
    const data = typeof window !== 'undefined' ? window.localStorage.getItem('swapit_data') : null;
    if (data) {
        const parsedData = JSON.parse(data);
        users = parsedData.users;
        items = parsedData.items;
        exchanges = parsedData.exchanges;
        chats = parsedData.chats;
        return;
    }

    users = [];
    items = [];
    exchanges = [];
    chats = [];

    // Hashing passwords for initial users
    const aliceSalt = generateSalt();
    const bobSalt = generateSalt();
    const adminSalt = generateSalt();

    const alice = { id: '1', name: 'Ana', email: 'ana@example.com', salt: aliceSalt, hashedPassword: hashPassword('Password123', aliceSalt), emailVerified: true, phoneVerified: true, phone: '611222333', location: { country: 'España', city: 'Madrid', postalCode: '28013', address: 'Plaza Mayor, 1' }, preferences: ['Libros', 'Música', 'Hogar'] };
    const bob = { id: '2', name: 'Benito', email: 'benito@example.com', salt: bobSalt, hashedPassword: hashPassword('Password456', bobSalt), emailVerified: true, phoneVerified: true, phone: '655444333', location: { country: 'España', city: 'Barcelona', postalCode: '08001', address: 'Las Ramblas, 1' }, preferences: ['Electrónica', 'Videojuegos'] };
    const admin = { id: '3', name: 'Admin', email: 'azzazel69@gmail.com', salt: adminSalt, hashedPassword: hashPassword('AdminPassword123', adminSalt), emailVerified: true, phoneVerified: true, phone: '600000000', location: { country: 'España', city: 'Valencia', postalCode: '46002', address: 'Plaza del Ayuntamiento, 1' }, preferences: ['Otros'] };

    users.push(alice, bob, admin);

    items = [
        // Ana's Items (User 1)
        { id: '101', userId: '1', ownerName: 'Ana', title: 'Bicicleta Clásica', description: 'Bicicleta de carretera de 10 velocidades de los 80. Bien cuidada.', imageUrls: ['https://images.unsplash.com/photo-1559348349-36de8b9e11e?w=500', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500'], category: 'Vehículos', wishedItem: 'Monitor Ultrawide', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), likes: 2, favoritedBy: ['2'] },
        { id: '102', userId: '1', ownerName: 'Ana', title: 'Guitarra Acústica Yamaha', description: 'Ideal para principiantes. Incluye funda y afinador.', imageUrls: ['https://images.unsplash.com/photo-1510915361894-db8b60106945?w=500', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=500'], category: 'Música', wishedItem: 'Colección de Libros Antiguos', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), likes: 5, favoritedBy: ['2', '3'] },
        { id: '105', userId: '1', ownerName: 'Ana', title: 'Dron DJI Mini 2', description: 'Graba vídeo en 4K. Incluye mando y batería extra.', imageUrls: ['https://images.unsplash.com/photo-1607621247161-1e24a5b9b8b0?w=500', 'https://images.unsplash.com/photo-1507563589139-d3c2e7d7a2e8?w=500'], category: 'Electrónica', wishedItem: 'Casco de Moto', status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 10, favoritedBy: ['2'] },
        { id: '108', userId: '1', ownerName: 'Ana', title: 'Juego de Tazas de Cerámica', description: 'Hechas a mano. Cuatro tazas con un diseño único y rústico.', imageUrls: ['https://images.unsplash.com/photo-1594312693441-32c029a24786?w=500'], category: 'Hogar', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), likes: 1, favoritedBy: [] },
        { id: '109', userId: '1', ownerName: 'Ana', title: 'Patinete Eléctrico', description: 'Patinete eléctrico con autonomía de 20km, ideal para la ciudad.', imageUrls: ['https://images.unsplash.com/photo-1593922709633-855f71e54c86?w=500'], category: 'Vehículos', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), likes: 0, favoritedBy: [] },
        { id: '110', userId: '1', ownerName: 'Ana', title: 'Saga "Dune" Completa', description: 'Los 6 libros de la saga original de Frank Herbert en tapa blanda.', imageUrls: ['https://images.unsplash.com/photo-1633423539542-f83c3b31d167?w=500'], category: 'Libros', wishedItem: 'Videojuego Nintendo Switch', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 8).toISOString(), likes: 3, favoritedBy: [] },
        { id: '111', userId: '1', ownerName: 'Ana', title: 'Teclado Mecánico Keychron', description: 'Teclado 65% con switches brown, retroiluminación RGB.', imageUrls: ['https://images.unsplash.com/photo-1618384887924-2c8ab66a8a0b?w=500'], category: 'Electrónica', wishedItem: 'Tocadiscos', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), likes: 8, favoritedBy: ['2'] },
        { id: '112', userId: '1', ownerName: 'Ana', title: 'Cámara Analógica Canon AE-1', description: 'Cámara réflex de 35mm clásica. Funciona perfectamente.', imageUrls: ['https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=500'], category: 'Electrónica', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 12).toISOString(), likes: 4, favoritedBy: [] },
        
        // Benito's Items (User 2)
        { id: '103', userId: '2', ownerName: 'Benito', title: 'Colección de Libros Antiguos', description: 'Lote de 20 novelas clásicas. Incluye Tolstoy, Dickens y Austen.', imageUrls: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500'], category: 'Libros', wishedItem: 'Guitarra Acústica', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), likes: 8, favoritedBy: ['1'] },
        { id: '104', userId: '2', ownerName: 'Benito', title: 'Nintendo Switch', description: 'Con poco uso, incluye Zelda y Mario Kart 8.', imageUrls: ['https://images.unsplash.com/photo-1612036782180-6f0b6cd84627?w=500', 'https://images.unsplash.com/photo-1589254065909-b7086229d08c?w=500'], category: 'Videojuegos', wishedItem: '', status: 'EXCHANGED', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), likes: 15, favoritedBy: [] },
        { id: '106', userId: '2', ownerName: 'Benito', title: 'Chaqueta de Cuero', description: 'Chaqueta de cuero negro clásica, talla M. Apenas usada.', imageUrls: ['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=500', 'https://images.unsplash.com/photo-1611312449412-6cefac5dc2d0?w=500'], category: 'Ropa', wishedItem: 'Patinete', status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 2, favoritedBy: [] },
        { id: '113', userId: '2', ownerName: 'Benito', title: 'Tocadiscos Audio-Technica', description: 'Modelo AT-LP60X. Automático, con preamplificador. Casi nuevo.', imageUrls: ['https://images.unsplash.com/photo-1591321920387-014ea413a968?w=500'], category: 'Música', wishedItem: 'Teclado Mecánico', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), likes: 9, favoritedBy: ['1'] },
        { id: '114', userId: '2', ownerName: 'Benito', title: 'Cafetera Italiana Bialetti', description: 'Cafetera moka para 6 tazas. Un clásico del diseño.', imageUrls: ['https://images.unsplash.com/photo-1620524222472-a7d65b72183e?w=500'], category: 'Hogar', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), likes: 0, favoritedBy: [] },
        { id: '115', userId: '2', ownerName: 'Benito', title: 'Casco de Moto Modular', description: 'Talla L, con visor solar integrado. Marca LS2.', imageUrls: ['https://images.unsplash.com/photo-1599119747993-9c5954620068?w=500'], category: 'Vehículos', wishedItem: 'Dron', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), likes: 1, favoritedBy: [] },
        { id: '116', userId: '2', ownerName: 'Benito', title: 'Monitor Ultrawide LG', description: 'Monitor de 29 pulgadas, resolución 2560x1080, ideal para productividad.', imageUrls: ['https://images.unsplash.com/photo-1627843445396-5ab93a18b6a3?w=500'], category: 'Electrónica', wishedItem: 'Bicicleta Clásica', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), likes: 6, favoritedBy: ['1'] },
        { id: '117', userId: '2', ownerName: 'Benito', title: 'Mochila de Montaña 50L', description: 'Mochila de trekking con múltiples compartimentos. Marca Osprey.', imageUrls: ['https://images.unsplash.com/photo-1580610423292-8d2659e974f4?w=500'], category: 'Otros', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), likes: 3, favoritedBy: [] },

        // Admin's Items (User 3)
        { id: '107', userId: '3', ownerName: 'Admin', title: 'Clases de guitarra online', description: 'Ofrezco una hora de clase de guitarra para principiantes por videollamada.', imageUrls: ['https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=500'], category: 'Servicios', wishedItem: '', status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 4, favoritedBy: [] },
        { id: '118', userId: '3', ownerName: 'Admin', title: 'Set de Herramientas Bosch', description: 'Maletín con 108 piezas, incluye taladro percutor y puntas.', imageUrls: ['https://images.unsplash.com/photo-1556911985-652a60824b33?w=500'], category: 'Hogar', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), likes: 2, favoritedBy: [] },
        { id: '119', userId: '3', ownerName: 'Admin', title: 'Lámpara de Escritorio Vintage', description: 'Lámpara de metal de los años 60, estilo industrial.', imageUrls: ['https://images.unsplash.com/photo-1507494954209-4723e7f3b521?w=500'], category: 'Muebles', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), likes: 1, favoritedBy: [] },
        { id: '120', userId: '3', ownerName: 'Admin', title: 'Masaje Relajante a Domicilio', description: 'Sesión de 1 hora de masaje descontracturante. Solo en Valencia.', imageUrls: ['https://images.unsplash.com/photo-1598421830154-02a4b8849033?w=500'], category: 'Servicios', wishedItem: '', status: 'AVAILABLE', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), likes: 7, favoritedBy: ['1', '2'] },
    ];
    persistData();
};

const persistData = () => {
    if (typeof window !== 'undefined') {
        const data = JSON.stringify({ users, items, exchanges, chats });
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

class ApiClient {
  token = null;

  _getCurrentUserFromToken() {
    if (!this.token) {
        return null;
    }
    const userId = this.token.replace('fake-jwt-for-', '').replace('mock-jwt-google-mock-1', 'google-mock-1');
    if (userId === 'google-mock-1') {
        let mockUser = users.find(u => u.id === 'google-mock-1');
        if (!mockUser) {
            mockUser = { id: 'google-mock-1', name: 'Google Dev Mock', email: 'google.mock@example.com', emailVerified: true, phoneVerified: true, location: { country: 'España', city: 'Madrid', postalCode: '28013', address: 'Plaza Mayor, 1' }, preferences: ['Libros', 'Música', 'Hogar'] };
            users.push(mockUser);
            persistData();
        }
        return mockUser;
    }
    return users.find(u => u.id === userId);
  }

  _enrichItem(item, currentUser, currentUserItemsCache) {
      if (!item) return null;
      const owner = users.find(u => u.id === item.userId);
      if (!currentUser) {
           return { 
              ...item,
              isFavorited: false,
              isMatch: false,
              ownerLocation: owner ? owner.location : null
          };
      }
      
      const isFavorited = (item.favoritedBy || []).includes(currentUser.id);

      const currentUserItems = currentUserItemsCache || items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE');
      
      const isMatch = currentUserItems.some(userItem =>
        (userItem.wishedItem && item.title.toLowerCase().includes(userItem.wishedItem.toLowerCase())) &&
        (item.wishedItem && userItem.title.toLowerCase().includes(item.wishedItem.toLowerCase()))
      );

      return { 
          ...item, 
          isFavorited,
          isMatch,
          ownerLocation: owner ? owner.location : null
      };
  }

  async simulateDelay(ms = 500) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  setToken(token) {
    this.token = token;
  }
  
  async login(email, password) {
      await this.simulateDelay();
      const user = users.find(u => u.email === email);
      if (user && user.hashedPassword === hashPassword(password, user.salt)) {
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
      if (!googleUser || !googleUser.email) {
          throw new Error('Credencial de Google inválida.');
      }

      let user = users.find(u => u.email === googleUser.email);

      if (!user) {
          const salt = generateSalt();
          const hashedPassword = hashPassword(`google-user-${Date.now()}`, salt);
          const newUser = {
              id: String(users.length + 1),
              name: googleUser.name,
              email: googleUser.email,
              salt,
              hashedPassword,
              preferences: [],
              emailVerified: true,
              phoneVerified: false,
              location: null,
              fcmToken: null,
          };
          users.push(newUser);
          user = newUser;
          persistData();
      }
      
      const dummyToken = `fake-jwt-for-${user.id}`;
      this.setToken(dummyToken);
      return { token: dummyToken };
  }
  
  async register(name, email, password) {
      await this.simulateDelay();
      if (users.some(u => u.email === email)) {
          throw new Error('Ya existe un usuario con este correo.');
      }
      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);
      const newUser = {
          id: String(users.length + 1),
          name,
          email,
          salt,
          hashedPassword,
          preferences: [],
          emailVerified: false,
          phoneVerified: false,
          fcmToken: null,
      };
      users.push(newUser);
      persistData();
      
      const { hashedPassword: _, salt: __, ...userToReturn } = newUser;
      return userToReturn;
  }

  async getCurrentUser() {
      await this.simulateDelay(200);
      if (!this.token) {
          throw new Error('No autenticado');
      }
      const user = this._getCurrentUserFromToken();
      if (user) {
          const { hashedPassword: _, salt: __, ...userToReturn } = user;
          return userToReturn;
      }
      throw new Error('Usuario no encontrado');
  }
  
  async getAllItems() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      const currentUserItems = currentUser ? items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE') : [];
      return items.map(item => this._enrichItem(item, currentUser, currentUserItems));
  }
  
  async getItemById(itemId) {
      await this.simulateDelay(300);
      const currentUser = this._getCurrentUserFromToken();
      const currentUserItems = currentUser ? items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE') : [];
      const item = items.find(item => item.id === itemId);
      return this._enrichItem(item, currentUser, currentUserItems);
  }
  
  async getUserItems(userId) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      const userItems = items.filter(item => item.userId === userId);
      // For enriching our own items, we don't need to check for matches against ourselves.
      const enrichmentItems = (currentUser && currentUser.id !== userId) 
        ? items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE') 
        : [];
      return userItems.map(item => this._enrichItem(item, currentUser, enrichmentItems));
  }

  async getUserProfile(userId) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("Usuario no encontrado.");
      
      const currentUserItems = currentUser ? items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE') : [];
      
      const userItems = items
          .filter(item => item.userId === userId && item.status === 'AVAILABLE')
          .map(item => this._enrichItem(item, currentUser, currentUserItems));

      const { hashedPassword, salt, email, ...publicProfile } = user;
      return { ...publicProfile, items: userItems };
  }
  
  async createItem(itemData) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) {
          throw new Error('Autenticación requerida');
      }
      const newItem = {
          id: `item-${Date.now()}`,
          userId: currentUser.id,
          ownerName: currentUser.name,
          ...itemData,
          status: 'AVAILABLE',
          createdAt: new Date().toISOString(),
          likes: 0,
          favoritedBy: [],
      };
      items.unshift(newItem);
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
      if (item.userId !== currentUser.id) throw new Error('No autorizado para editar este artículo');
      if (item.status !== 'AVAILABLE') throw new Error('No se puede editar un artículo que ya está en un intercambio.');

      const updatedItem = { ...item, ...itemData, updatedAt: new Date().toISOString() };
      items[itemIndex] = updatedItem;
      persistData();
      return updatedItem;
  }

  async deleteItem(itemId) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      
      const itemIndex = items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) throw new Error('Artículo no encontrado');

      const item = items[itemIndex];
      if (item.userId !== currentUser.id) throw new Error('No autorizado para eliminar este artículo');
      
      // Prevent deleting an item that's already part of a completed/accepted trade
      if (item.status === 'EXCHANGED') {
          throw new Error('No se puede eliminar un artículo que ya ha sido intercambiado.');
      }

      // Find pending exchanges involving this item and cancel them
      const affectedExchanges = exchanges.filter(ex => 
          ex.status === 'PENDING' && 
          (ex.requestedItemId === itemId || ex.offeredItemIds.includes(itemId))
      );

      for (const exchange of affectedExchanges) {
          exchange.status = ExchangeStatus.Rejected;
          const chat = chats.find(c => c.id === exchange.id);
          if (chat) {
              chat.messages.push({
                  id: `msg-system-${Date.now()}-${Math.random()}`,
                  senderId: 'system',
                  text: `El artículo "${item.title}" ya no está disponible y la negociación se ha cancelado.`,
                  timestamp: new Date().toISOString(),
                  type: 'SYSTEM'
              });
          }
      }

      items.splice(itemIndex, 1);
      persistData();
      return { success: true };
  }
  
  async getExchanges() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) {
          throw new Error('Autenticación requerida');
      }
      const userExchanges = exchanges.filter(ex => 
        (ex.requesterId === currentUser.id || ex.ownerId === currentUser.id) &&
        (!ex.deletedBy || !ex.deletedBy.includes(currentUser.id))
      );

      return userExchanges.map(ex => ({
          ...ex,
          requestedItem: items.find(item => item.id === ex.requestedItemId) || { title: 'Artículo eliminado', status: 'DELETED' },
          offeredItems: ex.offeredItemIds.map(id => items.find(item => item.id === id)).filter(Boolean),
      }));
  }

  async createExchangeProposal(proposal) {
      await this.simulateDelay();
      const requester = this._getCurrentUserFromToken();
      if (!requester) throw new Error('Autenticación requerida');
      
      const requestedItem = await this.getItemById(proposal.requestedItemId);
      if (!requestedItem || requestedItem.status !== 'AVAILABLE') throw new Error('Este artículo no está disponible para intercambio.');

      const owner = users.find(u => u.id === requestedItem.userId);
      if (!owner) throw new Error('Propietario del artículo no encontrado.');
      
      addNotificationDev(owner.id, { title: 'Nueva propuesta de intercambio', body: `${requester.name} quiere tu ${requestedItem.title}` });

      const offeredOtherItems = proposal.otherItems || [];
      const allOfferedIds = [...proposal.offeredItemIds, ...offeredOtherItems.map(item => item.id)];
      const itemStatus = allOfferedIds.reduce((acc, id) => {
        acc[id] = 'PENDING';
        return acc;
      }, {});

      const newExchange = {
          id: `ex-${Date.now()}`,
          requesterId: requester.id,
          requesterName: requester.name,
          ownerId: owner.id,
          ownerName: owner.name,
          requestedItemId: proposal.requestedItemId,
          offeredItemIds: proposal.offeredItemIds,
          offeredOtherItems: offeredOtherItems,
          acceptedOfferedItemIds: [],
          itemStatus: itemStatus,
          status: ExchangeStatus.Pending,
          confirmedByOwner: false,
          confirmedByRequester: false,
          createdAt: new Date().toISOString(),
          deletedBy: [],
      };
      exchanges.unshift(newExchange);
      
      const initialMessage = {
          id: `msg-${Date.now()}`,
          senderId: requester.id,
          timestamp: new Date().toISOString(),
          type: 'PROPOSAL',
          text: proposal.message,
      };

      const newChat = {
          id: newExchange.id,
          participantIds: [requester.id, owner.id],
          messages: [initialMessage]
      };
      chats.unshift(newChat);
      persistData();

      return newExchange;
  }
  
  async getChatAndExchangeDetails(chatId) {
    await this.simulateDelay(200);
    const currentUser = this._getCurrentUserFromToken();
    if (!currentUser) throw new Error('Autenticación requerida');

    const chat = chats.find(c => c.id === chatId);
    const exchange = exchanges.find(ex => ex.id === chatId);

    if (!chat || !exchange || (chat.participantIds.indexOf(currentUser.id) === -1)) {
        throw new Error('Chat no encontrado o acceso denegado.');
    }
    
    const owner = users.find(u => u.id === exchange.ownerId);
    const requester = users.find(u => u.id === exchange.requesterId);
    if (!owner || !requester) throw new Error('Participante no encontrado.');
    const { hashedPassword: _, salt: __, ...ownerPublic } = owner;
    const { hashedPassword: ___, salt: ____, ...requesterPublic } = requester;
    
    const allItemIds = [...new Set([exchange.requestedItemId, ...exchange.offeredItemIds])];
    const regularItems = allItemIds.map(id => items.find(item => item.id === id)).filter(Boolean);
    const otherItems = (exchange.offeredOtherItems || []).map(item => ({
        ...item,
        title: 'Otro artículo',
        description: item.description,
        isOther: true
    }));

    const allItems = [...regularItems, ...otherItems];
    
    const detailedExchange = { ...exchange, allItems, owner: ownerPublic, requester: requesterPublic };
    
    return { chat, exchange: detailedExchange };
  }
  
  async sendMessage(chatId, text) {
      await this.simulateDelay(150);
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      
      const chat = chats.find(c => c.id === chatId);
      if (!chat || (chat.participantIds.indexOf(currentUser.id) === -1)) {
          throw new Error('Chat no encontrado o acceso denegado.');
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

    async respondToExchange(exchangeId, action) { // action is 'ACCEPT' or 'REJECT'
        await this.simulateDelay();
        const currentUser = this._getCurrentUserFromToken();
        const exchange = exchanges.find(ex => ex.id === exchangeId);
        const chat = chats.find(c => c.id === exchangeId);

        if (!exchange) throw new Error('Intercambio no encontrado');
        if (currentUser.id !== exchange.ownerId) throw new Error('No autorizado para responder a esta oferta');
        if (exchange.status !== ExchangeStatus.Pending) throw new Error('Esta oferta ya ha sido respondida.');
        
        const owner = users.find(u => u.id === exchange.ownerId);
        const requester = users.find(u => u.id === exchange.requesterId);

        if (action === 'ACCEPT') {
            exchange.status = ExchangeStatus.Accepted;
            exchange.acceptedOfferedItemIds = [...exchange.offeredItemIds, ...(exchange.offeredOtherItems || []).map(i => i.id)];
            
            const finalTradeItems = [exchange.requestedItemId, ...exchange.acceptedOfferedItemIds];
            items.forEach(item => {
                if (finalTradeItems.includes(item.id)) {
                    item.status = 'RESERVED';
                }
            });
            
            addNotificationDev(requester.id, { 
                title: '¡Tu propuesta ha sido aceptada!', 
                body: `${owner.name} ha aceptado. Por favor, confirma el intercambio para finalizar.` 
            });
            addNotificationDev(owner.id, { 
                title: 'Has aceptado un intercambio', 
                body: `Esperando tu confirmación final para el intercambio con ${requester.name}.` 
            });

            const systemMessageText = `${owner.name} ha aceptado la propuesta. Ambos usuarios deben confirmar el intercambio en este chat para finalizarlo.`;
            if (chat) {
                chat.messages.push({
                    id: `msg-system-${Date.now()}`, senderId: 'system', text: systemMessageText, timestamp: new Date().toISOString(), type: 'SYSTEM'
                });
            }
        } else { // REJECT
            exchange.status = ExchangeStatus.Rejected;
            const systemMessageText = `${owner.name} ha rechazado la propuesta de intercambio.`;
            if (chat) {
                chat.messages.push({
                    id: `msg-system-${Date.now()}`, senderId: 'system', text: systemMessageText, timestamp: new Date().toISOString(), type: 'SYSTEM'
                });
            }
        }
        
        persistData();
        return exchange;
    }

    async modifyExchangeProposal(exchangeId, { offeredItemIds, otherItems, message }) {
        await this.simulateDelay();
        const currentUser = this._getCurrentUserFromToken();
        const exchange = exchanges.find(ex => ex.id === exchangeId);
        const chat = chats.find(c => c.id === exchangeId);
        
        if (!exchange) throw new Error('Intercambio no encontrado');
        if (currentUser.id !== exchange.requesterId) throw new Error('No autorizado para modificar esta oferta');
        if (exchange.status !== ExchangeStatus.Pending) throw new Error('No se puede modificar una oferta que ya ha sido respondida.');

        exchange.offeredItemIds = offeredItemIds;
        exchange.offeredOtherItems = otherItems || [];
        
        exchange.itemStatus = [...offeredItemIds, ...(otherItems || []).map(i => i.id)].reduce((acc, id) => {
            acc[id] = 'PENDING';
            return acc;
        }, {});

        const systemMessageText = `${currentUser.name} ha modificado la oferta.`;
        if (chat) {
            chat.messages.push({
                id: `msg-system-mod-${Date.now()}`, senderId: 'system', text: systemMessageText, timestamp: new Date().toISOString(), type: 'SYSTEM'
            });

            if (message && message.trim()) {
                 chat.messages.push({
                    id: `msg-${Date.now()}`,
                    senderId: currentUser.id,
                    text: message,
                    timestamp: new Date().toISOString(),
                    type: 'TEXT',
                });
            }
        }

        persistData();
        return exchange;
    }

// FIX: Add missing 'addCounterOffer' method to handle counter-proposals from the item owner.
    /**
     * Permite al propietario de un artículo hacer una contraoferta
     * pidiendo artículos adicionales del solicitante.
     */
    async addCounterOffer(exchangeId, newItemIds) {
        await this.simulateDelay();
        const currentUser = this._getCurrentUserFromToken();
        if (!currentUser) throw new Error('Autenticación requerida');

        const exchange = exchanges.find(ex => ex.id === exchangeId);
        if (!exchange) throw new Error('Intercambio no encontrado');
        if (currentUser.id !== exchange.ownerId) throw new Error('No autorizado para hacer una contraoferta');
        if (exchange.status !== ExchangeStatus.Pending) throw new Error('Solo se puede hacer una contraoferta en un intercambio pendiente.');

        // Add new items to the offered items list.
        const existingOffered = new Set(exchange.offeredItemIds);
        newItemIds.forEach(id => {
            const item = items.find(i => i.id === id);
            // Ensure the added item belongs to the requester and is available
            if (item && item.userId === exchange.requesterId && item.status === 'AVAILABLE') {
                existingOffered.add(id);
            }
        });
        exchange.offeredItemIds = Array.from(existingOffered);

        // Update item status for all offered items
        exchange.itemStatus = exchange.offeredItemIds.reduce((acc, id) => {
            acc[id] = 'PENDING';
            return acc;
        }, {});

        // Add system message to chat
        const chat = chats.find(c => c.id === exchangeId);
        if (chat) {
            const newItems = newItemIds.map(id => items.find(i => i.id === id)?.title).filter(Boolean);
            const messageText = `${currentUser.name} ha hecho una contraoferta, pidiendo también: ${newItems.join(', ')}.`;
            chat.messages.push({
                id: `msg-system-counter-${Date.now()}`,
                senderId: 'system',
                text: messageText,
                timestamp: new Date().toISOString(),
                type: 'SYSTEM'
            });
        }
        
        // Notify the requester
        const requester = users.find(u => u.id === exchange.requesterId);
        if(requester) {
            addNotificationDev(requester.id, {
                title: 'Has recibido una contraoferta',
                body: `${currentUser.name} ha modificado la oferta de intercambio.`
            });
        }

        persistData();
        return exchange;
    }

  async confirmFinalExchange(exchangeId) {
    await this.simulateDelay();
    const currentUser = this._getCurrentUserFromToken();
    if (!currentUser) throw new Error('Autenticación requerida');

    const exchange = exchanges.find(ex => ex.id === exchangeId);
    if (!exchange || exchange.status !== ExchangeStatus.Accepted) {
        throw new Error('No se puede confirmar este intercambio.');
    }
    
    const chat = chats.find(c => c.id === exchangeId);

    if (exchange.ownerId === currentUser.id) {
        if (exchange.confirmedByOwner) return exchange; // Already confirmed
        exchange.confirmedByOwner = true;
    } else if (exchange.requesterId === currentUser.id) {
        if (exchange.confirmedByRequester) return exchange; // Already confirmed
        exchange.confirmedByRequester = true;
    } else {
        throw new Error('No eres parte de este intercambio.');
    }
    
    if (chat) {
        chat.messages.push({
            id: `msg-system-${Date.now()}`, senderId: 'system', text: `${currentUser.name} ha confirmado el intercambio.`, timestamp: new Date().toISOString(), type: 'SYSTEM'
        });
    }

    if (exchange.confirmedByOwner && exchange.confirmedByRequester) {
        exchange.status = ExchangeStatus.Completed;
        
        const finalTradeItems = [exchange.requestedItemId, ...exchange.acceptedOfferedItemIds];
        items.forEach(item => {
            if (finalTradeItems.includes(item.id)) {
                item.status = 'EXCHANGED';
            }
        });
        
        // Reject other pending exchanges involving these now-exchanged items
        exchanges.forEach(ex => {
            if (ex.id !== exchangeId && ex.status === ExchangeStatus.Pending) {
                const otherInvolvedItems = [ex.requestedItemId, ...ex.offeredItemIds];
                if (otherInvolvedItems.some(id => finalTradeItems.includes(id))) {
                    ex.status = ExchangeStatus.Rejected;
                }
            }
        });

        if (chat) {
            chat.messages.push({
                id: `msg-system-final-${Date.now()}`, senderId: 'system', text: '¡TRATO CONFIRMADO! Aquí están los datos para coordinar.', timestamp: new Date().toISOString(), type: 'SYSTEM'
            });
        }
    }
    persistData();

    return exchange;
  }
  
  async deleteExchanges(exchangeIds) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      
      exchangeIds.forEach(id => {
          const exchange = exchanges.find(ex => ex.id === id);
          if (exchange && (exchange.ownerId === currentUser.id || exchange.requesterId === currentUser.id)) {
              if (!exchange.deletedBy) {
                  exchange.deletedBy = [];
              }
              if (!exchange.deletedBy.includes(currentUser.id)) {
                  exchange.deletedBy.push(currentUser.id);
              }
          }
      });
      persistData();
      return { success: true };
  }

  async updateUserPreferences(preferences) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.preferences = preferences;
      persistData();
      const { hashedPassword: _, salt: __, ...userToReturn } = currentUser;
      return userToReturn;
  }

  async verifyEmail() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.emailVerified = true;
      persistData();
      return true;
  }

  async sendPhoneVerificationCode(phone) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.phone = phone;
      persistData();
      console.log(`SIMULACIÓN: Enviando código a ${phone}. El código es 123456`);
      return "123456";
  }

  async verifyPhoneCode(code) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      if (code === "123456") {
          currentUser.phoneVerified = true;
          persistData();
          return true;
      }
      return false;
  }
  
  async updateUserLocation(location) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.location = location;
      persistData();
      const { hashedPassword: _, salt: __, ...userToReturn } = currentUser;
      return userToReturn;
  }

  async requestPasswordReset(email) {
      await this.simulateDelay();
      const user = users.find(u => u.email === email);
      if (user) {
          console.log(`SIMULACIÓN: Enlace de reseteo de contraseña enviado a ${email}. Nueva contraseña temporal podría ser 'nuevacontraseña123'`);
          return { message: "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña." };
      } else {
          return { message: "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña." };
      }
  }

  async saveFcmToken(token: string) {
      await this.simulateDelay(200);
      const currentUser = this._getCurrentUserFromToken();
      if (currentUser) {
          console.log(`Saving FCM token for user ${currentUser.id}: ${token}`);
          // @ts-ignore
          currentUser.fcmToken = token;
          persistData();
          return { success: true };
      }
      console.warn('Could not save FCM token, no user logged in.');
      return { success: false };
  }

  async toggleFavorite(itemId) {
    await this.simulateDelay(200);
    const currentUser = this._getCurrentUserFromToken();
    if (!currentUser) throw new Error('Autenticación requerida');
    
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error('Artículo no encontrado');

    if (!item.favoritedBy) item.favoritedBy = [];
    if (typeof item.likes !== 'number') item.likes = 0;

    const userIndex = item.favoritedBy.indexOf(currentUser.id);

    if (userIndex > -1) {
        // Un-favorite
        item.favoritedBy.splice(userIndex, 1);
        item.likes = Math.max(0, item.likes - 1);
    } else {
        // Favorite
        item.favoritedBy.push(currentUser.id);
        item.likes = item.likes + 1;
        
        // Send notification to owner, but not to self, and check cooldown
        if (item.userId !== currentUser.id) {
            const now = Date.now();
            const ownerId = item.userId;
            const favoriterId = currentUser.id;
            
            if (!favoriteNotificationCooldowns[ownerId]) {
                favoriteNotificationCooldowns[ownerId] = {};
            }

            const lastNotificationTimestamp = favoriteNotificationCooldowns[ownerId][favoriterId];
            const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;

            if (!lastNotificationTimestamp || (now - lastNotificationTimestamp > thirtyDaysInMillis)) {
                // If no record or last notification was more than 30 days ago, send one.
                addNotificationDev(ownerId, {
                    title: '¡Nuevo favorito!',
                    body: `${currentUser.name} ha añadido tu artículo "${item.title}" a favoritos.`,
                    meta: { type: 'favorite', itemId: item.id, userId: favoriterId }
                });
                // Update the timestamp
                favoriteNotificationCooldowns[ownerId][favoriterId] = now;
            }
        }
    }
    
    persistData();
    const currentUserItems = items.filter(i => i.userId === currentUser.id && i.status === 'AVAILABLE');
    return this._enrichItem(item, currentUser, currentUserItems);
  }

  async getFavoriteItems() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');

      const favoriteItems = items.filter(item => (item.favoritedBy || []).includes(currentUser.id));
      
      return favoriteItems.map(item => ({
          ...item,
          isFavorited: true // They are all favorites by definition
      }));
  }

  async resizeImageBeforeUpload(file) {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        const QUALITY = 0.8;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('No se pudo obtener el contexto del canvas'));
                
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', QUALITY));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  }
}

// --- Client-side View History Service ---
const VIEW_HISTORY_KEY = 'swapit_view_history';
const MAX_HISTORY_SIZE = 25;

export const viewHistoryService = {
  getHistory: () => {
    if (typeof window === 'undefined') return [];
    try {
      const historyJson = window.localStorage.getItem(VIEW_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
      console.error("Error reading view history", e);
      return [];
    }
  },
  addItem: (item) => {
    if (typeof window === 'undefined' || !item || !item.id || !item.category) return;
    try {
      let history = viewHistoryService.getHistory();
      // Remove existing to move it to the front
      history = history.filter(h => h.id !== item.id);
      // Add to the front
      history.unshift({ id: item.id, category: item.category });
      // Trim to max size
      if (history.length > MAX_HISTORY_SIZE) {
        history = history.slice(0, MAX_HISTORY_SIZE);
      }
      window.localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Error saving view history", e);
    }
  }
};

export const api = new ApiClient();

// --- DEV PATCH: anexar helpers dev al objeto api ---
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
api.addNotificationDev = addNotificationDev;
// @ts-ignore
api.getNotificationsForUserDev = getNotificationsForUserDev;
// @ts-ignore
api.markAllNotificationsReadDev = markAllNotificationsReadDev;
// @ts-ignore
api.loginWithGoogleMock = loginWithGoogleMock;
/* eslint-enable @typescript-eslint/ban-ts-comment */
// --- FIN PATCH ---
