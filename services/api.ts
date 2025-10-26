
import { User, Item, Exchange, ExchangeStatus } from '../types';
import { CATEGORIES } from '../constants';

// Define an internal user type for the mock DB that includes the password
interface MockUser extends User {
  password?: string;
}

// MOCK DATABASE
// ==================================

const users: MockUser[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', password: 'password123', phone: '+1234567890', phoneVerified: false, preferences: ['Vehicles', 'Music'] },
  { id: '2', name: 'Bob', email: 'bob@example.com', password: 'password456', phone: '+2345678901', phoneVerified: true, preferences: ['Books', 'Electronics'] },
];

let items: Item[] = [
  { id: '101', userId: '1', ownerName: 'Alice', title: 'Vintage Bicycle', description: 'A classic 10-speed road bike from the 80s. Well-maintained and recently tuned up. Perfect for city cruising or light touring. The frame is a beautiful blue and has some minor cosmetic scratches consistent with its age.', imageUrl: 'https://images.unsplash.com/photo-1559348349-36de83b9e11e?w=500&auto=format&fit=crop', category: CATEGORIES[2], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: '102', userId: '1', ownerName: 'Alice', title: 'Acoustic Guitar', description: 'Yamaha acoustic guitar, great for beginners. Comes with a soft case, a new set of strings, a tuner, and a stand. Has a warm, rich tone and is easy to play.', imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106945?w=500&auto=format&fit=crop', category: CATEGORIES[3], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: '103', userId: '2', ownerName: 'Bob', title: 'Old Books Collection', description: 'A set of 20 classic literature novels. Includes works by Tolstoy, Dickens, and Austen. All are hardcover editions in good condition. A fantastic instant library for any book lover.', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop', category: CATEGORIES[1], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: '104', userId: '2', ownerName: 'Bob', title: 'Nintendo Switch', description: 'Slightly used Nintendo Switch with two games: Zelda: Breath of the Wild and Mario Kart 8. Includes dock, Joy-Cons, and all original accessories. No scratches on the screen.', imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd84627?w=500&auto=format&fit=crop', category: CATEGORIES[0], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
];

let exchanges: Exchange[] = [
    { 
        id: 'ex001', 
        requesterId: '2', 
        requesterName: 'Bob',
        ownerId: '1',
        ownerName: 'Alice',
        offeredItemId: '104', // Bob's Switch
        requestedItemId: '101', // Alice's Bicycle
        offeredItem: items.find(i => i.id === '104')!,
        requestedItem: items.find(i => i.id === '101')!,
        status: ExchangeStatus.Pending,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    { 
        id: 'ex002', 
        requesterId: '1', 
        requesterName: 'Alice',
        ownerId: '2',
        ownerName: 'Bob',
        offeredItemId: '102', // Alice's Guitar
        requestedItemId: '103', // Bob's Books
        offeredItem: items.find(i => i.id === '102')!,
        requestedItem: items.find(i => i.id === '103')!,
        status: ExchangeStatus.Accepted,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    }
];


// MOCK API CLIENT
// ==================================

class ApiClient {
  private token: string | null = null;
  private currentUser: MockUser | null = null;

  private async simulateDelay(ms: number = 500) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  async login(email: string, password: string): Promise<{ token: string }> {
      await this.simulateDelay();
      const user = users.find(u => u.email === email);
      // Check against the user's specific stored password
      if (user && user.password === password) {
          this.currentUser = user;
          const dummyToken = `fake-jwt-for-${user.id}`;
          this.setToken(dummyToken);
          return { token: dummyToken };
      } else {
          // More generic error message
          throw new Error('Invalid email or password.');
      }
  }
  
  async register(name: string, email: string, password: string): Promise<User> {
      await this.simulateDelay();
      if (users.some(u => u.email === email)) {
          throw new Error('User with this email already exists.');
      }
      const newUser: MockUser = {
          id: String(users.length + 1),
          name,
          email,
          password, // Store the provided password
          preferences: [],
      };
      users.push(newUser);
      
      // Return the user object without the password
      const { password: _, ...userToReturn } = newUser;
      return userToReturn as User;
  }

  async getCurrentUser(): Promise<User> {
      await this.simulateDelay(200);
      if (!this.token) {
          throw new Error('Not authenticated');
      }
      const userId = this.token.replace('fake-jwt-for-', '');
      const user = users.find(u => u.id === userId);
      if (user) {
          this.currentUser = user;
          // Return user object without the password
          const { password: _, ...userToReturn } = user;
          return userToReturn as User;
      }
      throw new Error('User not found');
  }
  
  async getAllItems(): Promise<Item[]> {
      await this.simulateDelay();
      return [...items];
  }
  
  async getItemById(itemId: string): Promise<Item | undefined> {
      await this.simulateDelay(300);
      return items.find(item => item.id === itemId);
  }
  
  async getUserItems(userId: string): Promise<Item[]> {
      await this.simulateDelay();
      return items.filter(item => item.userId === userId);
  }
  
  async createItem(itemData: { title: string, description: string, category: string }): Promise<Item> {
      await this.simulateDelay();
      if (!this.currentUser) {
          throw new Error('Authentication required');
      }
      const newItem: Item = {
          id: `item-${Date.now()}`,
          userId: this.currentUser.id,
          ownerName: this.currentUser.name,
          imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300`, // Random placeholder image
          createdAt: new Date().toISOString(),
          ...itemData
      };
      items.unshift(newItem); // Add to the beginning of the list
      return newItem;
  }
  
  async getExchanges(): Promise<Exchange[]> {
      await this.simulateDelay();
      if (!this.currentUser) {
          throw new Error('Authentication required');
      }
      return exchanges.filter(ex => ex.ownerId === this.currentUser!.id || ex.requesterId === this.currentUser!.id);
  }

  async updateExchangeStatus(exchangeId: string, status: ExchangeStatus): Promise<Exchange> {
      await this.simulateDelay();
      const exchange = exchanges.find(ex => ex.id === exchangeId);
      if (!exchange) {
          throw new Error('Exchange not found');
      }
      if (this.currentUser?.id !== exchange.ownerId) {
          throw new Error('Permission denied: You are not the owner of the requested item.');
      }
      exchange.status = status;
      return { ...exchange };
  }

  async updateUserPreferences(preferences: string[]): Promise<User> {
      await this.simulateDelay();
      if (!this.currentUser) {
          throw new Error('Authentication required');
      }
      const user = users.find(u => u.id === this.currentUser!.id);
      if (!user) {
          throw new Error('User not found');
      }
      user.preferences = preferences;
      this.currentUser = user;
      
      // Return user object without the password
      const { password: _, ...userToReturn } = user;
      return userToReturn as User;
  }
}

export const api = new ApiClient();
