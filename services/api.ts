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

    const alice = { id: '1', name: 'Ana', email: 'ana@example.com', password: 'Password123', emailVerified: true, phoneVerified: true, phone: '611222333', location: { country: 'España', city: 'Madrid', postalCode: '28013', address: 'Plaza Mayor, 1' }, preferences: ['Libros', 'Música', 'Hogar'] };
    const bob = { id: '2', name: 'Benito', email: 'benito@example.com', password: 'Password456', emailVerified: true, phoneVerified: true, phone: '655444333', location: { country: 'España', city: 'Barcelona', postalCode: '08001', address: 'Las Ramblas, 1' }, preferences: ['Electrónica', 'Vehículos'] };
    const admin = { id: '3', name: 'Admin', email: 'azzazel69@gmail.com', password: 'AdminPassword123', emailVerified: true, phoneVerified: true, phone: '600000000', location: { country: 'España', city: 'Valencia', postalCode: '46002', address: 'Plaza del Ayuntamiento, 1' }, preferences: ['Otros'] };

    users.push(alice, bob, admin);

    items = [
        { id: '101', userId: '1', ownerName: 'Ana', title: 'Bicicleta Clásica', description: 'Una bicicleta de carretera clásica de 10 velocidades de los años 80. Bien cuidada y recién revisada.', imageUrls: ['https://images.unsplash.com/photo-1559348349-36de83b9e11e?w=500', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500'], category: 'Vehículos', status: 'AVAILABLE', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), likes: 0, favoritedBy: [] },
        { id: '102', userId: '1', ownerName: 'Ana', title: 'Guitarra Acústica', description: 'Guitarra acústica Yamaha, ideal para principiantes. Incluye funda y afinador.', imageUrls: ['https://images.unsplash.com/photo-1510915361894-db8b60106945?w=500', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=500'], category: 'Música', status: 'AVAILABLE', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), likes: 0, favoritedBy: [] },
        { id: '103', userId: '2', ownerName: 'Benito', title: 'Colección de Libros Antiguos', description: 'Lote de 20 novelas clásicas de la literatura. Incluye obras de Tolstoy, Dickens y Austen.', imageUrls: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500'], category: 'Libros', status: 'AVAILABLE', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), likes: 0, favoritedBy: [] },
        { id: '104', userId: '2', ownerName: 'Benito', title: 'Nintendo Switch', description: 'Nintendo Switch con poco uso, incluye dos juegos: Zelda y Mario Kart 8.', imageUrls: ['https://images.unsplash.com/photo-1612036782180-6f0b6cd84627?w=500', 'https://images.unsplash.com/photo-1589254065909-b7086229d08c?w=500'], category: 'Electrónica', status: 'EXCHANGED', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), likes: 0, favoritedBy: [] },
        { id: '105', userId: '1', ownerName: 'Ana', title: 'Dron DJI Mini 2', description: 'Dron compacto y potente, perfecto para principiantes. Graba vídeo en 4K. Incluye mando y batería extra.', imageUrls: ['https://images.unsplash.com/photo-1607621247161-1e24a5b9b8b0?w=500', 'https://images.unsplash.com/photo-1507563589139-d3c2e7d7a2e8?w=500'], category: 'Electrónica', status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 0, favoritedBy: [] },
        { id: '106', userId: '2', ownerName: 'Benito', title: 'Chaqueta de Cuero', description: 'Chaqueta de cuero negro clásica, talla M. Apenas usada, en excelentes condiciones. Estilo atemporal.', imageUrls: ['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=500', 'https://images.unsplash.com/photo-1611312449412-6cefac5dc2d0?w=500'], category: 'Ropa', status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 0, favoritedBy: [] },
        { id: '107', userId: '3', ownerName: 'Admin', title: 'Clases de guitarra online', description: 'Ofrezco una hora de clase de guitarra para principiantes a través de videollamada. Todos los niveles son bienvenidos.', imageUrls: ['https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=500'], category: 'Servicios', status: 'AVAILABLE', createdAt: new Date().toISOString(), likes: 0, favoritedBy: [] },
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

  _enrichItem(item, currentUser) {
      if (!item) return null;
      const isFavorited = currentUser ? (item.favoritedBy || []).includes(currentUser.id) : false;
      const owner = users.find(u => u.id === item.userId);
      return { 
          ...item, 
          isFavorited,
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
      if (user && user.password === password) {
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
          const newUser = {
              id: String(users.length + 1),
              name: googleUser.name,
              email: googleUser.email,
              password: `google-user-${Date.now()}`,
              preferences: [],
              emailVerified: true,
              phoneVerified: false,
              location: null,
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
      const newUser = {
          id: String(users.length + 1),
          name,
          email,
          password,
          preferences: [],
          emailVerified: false,
          phoneVerified: false,
      };
      users.push(newUser);
      persistData();
      
      const { password: _, ...userToReturn } = newUser;
      return userToReturn;
  }

  async getCurrentUser() {
      await this.simulateDelay(200);
      if (!this.token) {
          throw new Error('No autenticado');
      }
      const user = this._getCurrentUserFromToken();
      if (user) {
          const { password: _, ...userToReturn } = user;
          return userToReturn;
      }
      throw new Error('Usuario no encontrado');
  }
  
  async getAllItems() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      return items.map(item => this._enrichItem(item, currentUser));
  }
  
  async getItemById(itemId) {
      await this.simulateDelay(300);
      const currentUser = this._getCurrentUserFromToken();
      const item = items.find(item => item.id === itemId);
      return this._enrichItem(item, currentUser);
  }
  
  async getUserItems(userId) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      const userItems = items.filter(item => item.userId === userId);
      return userItems.map(item => this._enrichItem(item, currentUser));
  }

  async getUserProfile(userId) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("Usuario no encontrado.");
      
      const userItems = items
          .filter(item => item.userId === userId && item.status === 'AVAILABLE')
          .map(item => this._enrichItem(item, currentUser));

      const { password, email, ...publicProfile } = user;
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

      const allItemIdsInvolved = [proposal.requestedItemId, ...proposal.offeredItemIds];
      const itemStatus = allItemIdsInvolved.reduce((acc, id) => {
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
    const { password: _, ...ownerPublic } = owner;
    const { password: __, ...requesterPublic } = requester;
    
    const allItemIds = [...new Set([exchange.requestedItemId, ...exchange.offeredItemIds])];
    const allItems = allItemIds.map(id => items.find(item => item.id === id)).filter(Boolean);

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

    async updateItemInExchange(exchangeId, itemId, status) {
        await this.simulateDelay();
        const currentUser = this._getCurrentUserFromToken();
        const exchange = exchanges.find(ex => ex.id === exchangeId);

        if (!exchange) throw new Error('Intercambio no encontrado');
        if (currentUser.id !== exchange.ownerId) throw new Error('No autorizado para modificar este intercambio');
        if (!exchange.itemStatus[itemId]) throw new Error('Artículo no encontrado en este intercambio');

        exchange.itemStatus[itemId] = status;

        const allDecided = Object.values(exchange.itemStatus).every(s => s !== 'PENDING');

        if (allDecided) {
            const acceptedItemsIds = Object.keys(exchange.itemStatus).filter(id => exchange.itemStatus[id] === 'ACCEPTED');
            const acceptedByOwner = acceptedItemsIds.filter(id => exchange.offeredItemIds.includes(id));
            
            if (acceptedByOwner.length > 0) {
                exchange.status = ExchangeStatus.Accepted;
                exchange.acceptedOfferedItemIds = acceptedByOwner;

                const finalTradeItems = [exchange.requestedItemId, ...acceptedByOwner];
                items.forEach(item => {
                    if (finalTradeItems.includes(item.id)) {
                        item.status = 'RESERVED'; // New status: RESERVED
                    }
                });
                
                const owner = users.find(u => u.id === exchange.ownerId);
                const requester = users.find(u => u.id === exchange.requesterId);
                
                addNotificationDev(requester.id, { 
                    title: '¡Tu propuesta ha sido aceptada!', 
                    body: `${owner.name} ha aceptado. Por favor, confirma el intercambio para finalizar.` 
                });
                
                addNotificationDev(owner.id, { 
                    title: 'Has aceptado un intercambio', 
                    body: `Esperando tu confirmación final para el intercambio con ${requester.name}.` 
                });

                const systemMessageText = `${owner.name} ha aceptado la propuesta. Ambos usuarios deben confirmar el intercambio en este chat para finalizarlo.`;
                chats.find(c => c.id === exchangeId).messages.push({
                    id: `msg-system-${Date.now()}`, senderId: 'system', text: systemMessageText, timestamp: new Date().toISOString(), type: 'SYSTEM'
                });

            } else {
                exchange.status = ExchangeStatus.Rejected;
                chats.find(c => c.id === exchangeId).messages.push({
                    id: `msg-system-${Date.now()}`, senderId: 'system', text: 'El trato ha sido rechazado ya que no se aceptó ningún artículo.', timestamp: new Date().toISOString(), type: 'SYSTEM'
                });
            }
        }
        persistData();
        return exchange;
    }

    async addCounterOffer(exchangeId, itemIds) {
        await this.simulateDelay();
        const exchange = exchanges.find(ex => ex.id === exchangeId);
        if (!exchange) throw new Error("Intercambio no encontrado");

        itemIds.forEach(itemId => {
            if (!exchange.offeredItemIds.includes(itemId)) {
                exchange.offeredItemIds.push(itemId);
                exchange.itemStatus[itemId] = 'PENDING';
            }
        });
        
        const counterOfferItems = itemIds.map(id => items.find(i => i.id === id));
        chats.find(c => c.id === exchangeId).messages.push({
            id: `msg-system-${Date.now()}`, senderId: 'system', 
            text: `${exchange.ownerName} ha añadido ${counterOfferItems.map(i => i.title).join(', ')} a la negociación.`, 
            timestamp: new Date().toISOString(), type: 'SYSTEM'
        });
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
      const { password: _, ...userToReturn } = currentUser;
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
      const { password: _, ...userToReturn } = currentUser;
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
    return this._enrichItem(item, currentUser);
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