import { ExchangeStatus } from '../types.js';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.js';

let users = [];
let items = [];
let exchanges = [];
let chats = [];

const setupInitialData = () => {
    users = [];
    items = [];
    exchanges = [];
    chats = [];

    const alice = { id: '1', name: 'Ana', email: 'ana@example.com', password: 'Password123', emailVerified: true, phoneVerified: true, phone: '611222333', location: { country: 'España', city: 'Madrid', postalCode: '28013', address: 'Plaza Mayor, 1' }, preferences: ['Libros', 'Música', 'Hogar'] };
    const bob = { id: '2', name: 'Benito', email: 'benito@example.com', password: 'Password456', emailVerified: true, phoneVerified: true, phone: '655444333', location: { country: 'España', city: 'Barcelona', postalCode: '08001', address: 'Las Ramblas, 1' }, preferences: ['Electrónica', 'Vehículos'] };
    const admin = { id: '3', name: 'Admin', email: 'admin@example.com', password: 'AdminPassword123', emailVerified: true, phoneVerified: true, phone: '600000000', location: { country: 'España', city: 'Valencia', postalCode: '46002', address: 'Plaza del Ayuntamiento, 1' }, preferences: ['Otros'] };

    users.push(alice, bob, admin);

    items = [
        { id: '101', userId: '1', ownerName: 'Ana', title: 'Bicicleta Clásica', description: 'Una bicicleta de carretera clásica de 10 velocidades de los años 80. Bien cuidada y recién revisada.', imageUrls: ['https://images.unsplash.com/photo-1559348349-36de83b9e11e?w=500', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500'], category: 'Vehículos', status: 'AVAILABLE', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
        { id: '102', userId: '1', ownerName: 'Ana', title: 'Guitarra Acústica', description: 'Guitarra acústica Yamaha, ideal para principiantes. Incluye funda y afinador.', imageUrls: ['https://images.unsplash.com/photo-1510915361894-db8b60106945?w=500', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=500'], category: 'Música', status: 'AVAILABLE', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
        { id: '103', userId: '2', ownerName: 'Benito', title: 'Colección de Libros Antiguos', description: 'Lote de 20 novelas clásicas de la literatura. Incluye obras de Tolstoy, Dickens y Austen.', imageUrls: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500'], category: 'Libros', status: 'AVAILABLE', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
        { id: '104', userId: '2', ownerName: 'Benito', title: 'Nintendo Switch', description: 'Nintendo Switch con poco uso, incluye dos juegos: Zelda y Mario Kart 8.', imageUrls: ['https://images.unsplash.com/photo-1612036782180-6f0b6cd84627?w=500', 'https://images.unsplash.com/photo-1589254065909-b7086229d08c?w=500'], category: 'Electrónica', status: 'EXCHANGED', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
        { id: '105', userId: '1', ownerName: 'Ana', title: 'Dron DJI Mini 2', description: 'Dron compacto y potente, perfecto para principiantes. Graba vídeo en 4K. Incluye mando y batería extra.', imageUrls: ['https://images.unsplash.com/photo-1607621247161-1e24a5b9b8b0?w=500', 'https://images.unsplash.com/photo-1507563589139-d3c2e7d7a2e8?w=500'], category: 'Electrónica', status: 'AVAILABLE', createdAt: new Date().toISOString() },
        { id: '106', userId: '2', ownerName: 'Benito', title: 'Chaqueta de Cuero', description: 'Chaqueta de cuero negro clásica, talla M. Apenas usada, en excelentes condiciones. Estilo atemporal.', imageUrls: ['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=500', 'https://images.unsplash.com/photo-1611312449412-6cefac5dc2d0?w=500'], category: 'Ropa', status: 'AVAILABLE', createdAt: new Date().toISOString() },
        { id: '107', userId: '3', ownerName: 'Admin', title: 'Clases de guitarra online', description: 'Ofrezco una hora de clase de guitarra para principiantes a través de videollamada. Todos los niveles son bienvenidos.', imageUrls: ['https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=500'], category: 'Servicios', status: 'AVAILABLE', createdAt: new Date().toISOString() },
    ];
};

// Reinicia los datos cada vez que el script se carga para asegurar un estado limpio para pruebas.
setupInitialData();

class ApiClient {
  token = null;

  _getCurrentUserFromToken() {
    if (!this.token) {
        return null;
    }
    const userId = this.token.replace('fake-jwt-for-', '');
    return users.find(u => u.id === userId);
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
      
      const { password: _, ...userToReturn } = newUser;
      return userToReturn;
  }

  async getCurrentUser() {
      await this.simulateDelay(200);
      if (!this.token) {
          throw new Error('No autenticado');
      }
      const userId = this.token.replace('fake-jwt-for-', '');
      const user = users.find(u => u.id === userId);
      if (user) {
          const { password: _, ...userToReturn } = user;
          return userToReturn;
      }
      throw new Error('Usuario no encontrado');
  }
  
  async getAllItems() {
      await this.simulateDelay();
      return items.filter(item => item.status === 'AVAILABLE');
  }
  
  async getItemById(itemId) {
      await this.simulateDelay(300);
      return items.find(item => item.id === itemId);
  }
  
  async getUserItems(userId) {
      await this.simulateDelay();
      return items.filter(item => item.userId === userId);
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
      };
      items.unshift(newItem);
      return newItem;
  }
  
  async getExchanges() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) {
          throw new Error('Autenticación requerida');
      }
      const userExchanges = exchanges.filter(ex => ex.ownerId === currentUser.id || ex.requesterId === currentUser.id);

      // Populate item details
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

      const newExchange = {
          id: `ex-${Date.now()}`,
          requesterId: requester.id,
          requesterName: requester.name,
          ownerId: owner.id,
          ownerName: owner.name,
          requestedItemId: proposal.requestedItemId,
          offeredItemIds: proposal.offeredItemIds,
          status: ExchangeStatus.Pending,
          votedByOwner: false,
          votedByRequester: false,
          createdAt: new Date().toISOString(),
      };
      exchanges.unshift(newExchange);
      
      const offeredItemsDetails = proposal.offeredItemIds.map(id => items.find(item => item.id === id));
      
      const initialMessage = {
          id: `msg-${Date.now()}`,
          senderId: requester.id,
          timestamp: new Date().toISOString(),
          type: 'PROPOSAL',
          offeredItems: offeredItemsDetails.map(item => ({ id: item.id, title: item.title, imageUrl: item.imageUrls[0] })),
          text: proposal.message,
      };

      const newChat = {
          id: newExchange.id, // Use exchange ID as chat ID
          participantIds: [requester.id, owner.id],
          messages: [initialMessage]
      };
      chats.unshift(newChat);

      return newExchange;
  }

  async updateExchangeStatus(exchangeId, status) {
      await this.simulateDelay();
      const exchange = exchanges.find(ex => ex.id === exchangeId);
      if (!exchange) throw new Error('Intercambio no encontrado');
      
      const currentUser = this._getCurrentUserFromToken();
      if (currentUser?.id !== exchange.ownerId) throw new Error('Permiso denegado.');
      
      exchange.status = status;

      if (status === ExchangeStatus.Accepted) {
        const involvedItemIds = [exchange.requestedItemId, ...exchange.offeredItemIds];
        
        items.forEach(item => {
            if (involvedItemIds.includes(item.id)) {
                item.status = 'EXCHANGED';
            }
        });

        exchanges.forEach(ex => {
            if (ex.id !== exchangeId && ex.status === ExchangeStatus.Pending) {
                const otherInvolvedItems = [ex.requestedItemId, ...ex.offeredItemIds];
                if (otherInvolvedItems.some(id => involvedItemIds.includes(id))) {
                    ex.status = ExchangeStatus.Rejected;
                }
            }
        });
      }

      const chat = chats.find(c => c.id === exchangeId);
      if (chat) {
          let systemMessageText = '';
          if (status === ExchangeStatus.Accepted) {
              const owner = users.find(u => u.id === exchange.ownerId);
              const requester = users.find(u => u.id === exchange.requesterId);
              systemMessageText = `¡TRATO ACEPTADO! Aquí están los datos para coordinar el intercambio: ${owner.name} (tel: ${owner.phone}) y ${requester.name} (tel: ${requester.phone}).`;
          } else if (status === ExchangeStatus.Rejected) {
              systemMessageText = `Trato rechazado por ${currentUser.name}.`;
          }

          if (systemMessageText) {
              chat.messages.push({
                  id: `msg-system-${Date.now()}`,
                  senderId: 'system',
                  text: systemMessageText,
                  timestamp: new Date().toISOString(),
                  type: 'SYSTEM',
              });
          }
      }

      return { ...exchange };
  }
  
  async getChatAndExchangeDetails(chatId) {
    await this.simulateDelay(200);
    const currentUser = this._getCurrentUserFromToken();
    if (!currentUser) throw new Error('Autenticación requerida');

    const chat = chats.find(c => c.id === chatId);
    const exchange = exchanges.find(ex => ex.id === chatId);

    if (!chat || !exchange || !chat.participantIds.includes(currentUser.id)) {
        throw new Error('Chat no encontrado o acceso denegado.');
    }
    
    // Populate full item details in the exchange part of the response
    const detailedExchange = {
        ...exchange,
        requestedItem: items.find(item => item.id === exchange.requestedItemId),
        offeredItems: exchange.offeredItemIds.map(id => items.find(item => item.id === id)),
    };
    
    return { chat, exchange: detailedExchange };
  }
  
  async sendMessage(chatId, text) {
      await this.simulateDelay(150);
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      
      const chat = chats.find(c => c.id === chatId);
      if (!chat || !chat.participantIds.includes(currentUser.id)) {
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
      return newMessage;
  }

  async voteForExchange(exchangeId) {
    await this.simulateDelay();
    const currentUser = this._getCurrentUserFromToken();
    if (!currentUser) throw new Error('Autenticación requerida');

    const exchange = exchanges.find(ex => ex.id === exchangeId);
    if (!exchange || exchange.status !== ExchangeStatus.Accepted) {
        throw new Error('No se puede votar en este intercambio.');
    }

    if (exchange.ownerId === currentUser.id) {
        exchange.votedByOwner = true;
    } else if (exchange.requesterId === currentUser.id) {
        exchange.votedByRequester = true;
    } else {
        throw new Error('No eres parte de este intercambio.');
    }

    if (exchange.votedByOwner && exchange.votedByRequester) {
        exchange.status = ExchangeStatus.Completed;
        const involvedItemIds = [exchange.requestedItemId, ...exchange.offeredItemIds];
        items = items.filter(item => !involvedItemIds.includes(item.id));
    }

    return exchange;
  }

  async updateUserPreferences(preferences) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.preferences = preferences;
      const { password: _, ...userToReturn } = currentUser;
      return userToReturn;
  }

  async verifyEmail() {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.emailVerified = true;
      return true;
  }

  async sendPhoneVerificationCode(phone) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.phone = phone;
      console.log(`SIMULACIÓN: Enviando código a ${phone}. El código es 123456`);
      return "123456";
  }

  async verifyPhoneCode(code) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      if (code === "123456") {
          currentUser.phoneVerified = true;
          return true;
      }
      return false;
  }
  
  async updateUserLocation(location) {
      await this.simulateDelay();
      const currentUser = this._getCurrentUserFromToken();
      if (!currentUser) throw new Error('Autenticación requerida');
      currentUser.location = location;
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
}

export const api = new ApiClient();