
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

const DEMO_USERS = [
  {
    id: 'admin_user_id',
    name: 'Admin Swapit',
    email: 'admin_swapit_v3@test.com',
    role: 'SUPER_ADMIN',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    location: { city: 'Madrid', province: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038 },
    preferences: ['Electrónica', 'Hogar'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 5.0,
    swapsCount: 0,
    bio: 'Administrador del sistema'
  },
  {
    id: 'carlos_user_id',
    name: 'Carlos García',
    email: 'carlos_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    location: { city: 'Barcelona', province: 'Barcelona', country: 'España', lat: 41.3851, lng: 2.1734 },
    preferences: ['Deportes', 'Herramientas'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 4.8,
    swapsCount: 5,
    bio: 'Amante del deporte y la montaña'
  },
  {
    id: 'lucia_user_id',
    name: 'Lucía Martín',
    email: 'lucia_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia',
    location: { city: 'Sevilla', province: 'Sevilla', country: 'España', lat: 37.3891, lng: -5.9845 },
    preferences: ['Moda', 'Libros'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 4.9,
    swapsCount: 12,
    bio: 'Lectora empedernida'
  },
  {
    id: 'ana_user_id',
    name: 'Ana López',
    email: 'ana_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    location: { city: 'Valencia', province: 'Valencia', country: 'España', lat: 39.4699, lng: -0.3763 },
    preferences: ['Hogar', 'Juguetes'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 4.7,
    swapsCount: 8,
    bio: 'Decoración y hogar'
  },
  {
    id: 'miguel_user_id',
    name: 'Miguel Ángel',
    email: 'miguel_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel',
    location: { city: 'Zaragoza', province: 'Zaragoza', country: 'España', lat: 41.6488, lng: -0.8891 },
    preferences: ['Electrónica', 'Videojuegos'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 4.5,
    swapsCount: 3,
    bio: 'Gamer de corazón'
  },
  {
    id: 'elena_user_id',
    name: 'Elena Ruiz',
    email: 'elena_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    location: { city: 'Málaga', province: 'Málaga', country: 'España', lat: 36.7213, lng: -4.4214 },
    preferences: ['Moda', 'Coleccionismo'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 4.6,
    swapsCount: 7,
    bio: 'Moda sostenible'
  },
  {
    id: 'david_user_id',
    name: 'David Sanz',
    email: 'david_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    location: { city: 'Bilbao', province: 'Vizcaya', country: 'España', lat: 43.2630, lng: -2.9350 },
    preferences: ['Herramientas', 'Motor'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 4.4,
    swapsCount: 2,
    bio: 'Bricolaje y motor'
  },
  {
    id: 'pedro_user_id',
    name: 'Pedro Troll',
    email: 'pedro_troll_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro',
    location: { city: 'Madrid', province: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038 },
    preferences: ['Otros'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 1.2,
    swapsCount: 0,
    bio: 'No soy un troll'
  },
  {
    id: 'scammer_user_id',
    name: 'Bot Scammer',
    email: 'scammer_v3@test.com',
    role: 'USER',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scammer',
    location: { city: 'Barcelona', province: 'Barcelona', country: 'España', lat: 41.3851, lng: 2.1734 },
    preferences: ['Electrónica'],
    createdAt: new Date(),
    updatedAt: new Date(),
    rating: 0.5,
    swapsCount: 0,
    bio: 'Ofertas increíbles'
  }
];

export const seedDemoUsers = async () => {
  console.log('Checking demo users...');
  const promises = DEMO_USERS.map(async (userData) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', userData.email));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        console.log(`Seeding user: ${userData.email}`);
        await setDoc(doc(db, 'users', userData.id), userData);
      }
    } catch (e) {
      console.error(`Error seeding user ${userData.email}:`, e);
    }
  });
  await Promise.all(promises);
  console.log('Demo users check complete.');
};

const DEMO_ITEMS = [
  {
    id: 'item_1',
    userId: 'carlos_user_id',
    ownerName: 'Carlos García',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    title: 'Bicicleta de Montaña',
    category: 'Deportes',
    condition: 'Good',
    wishedItem: 'Consola de videojuegos',
    description: 'Bicicleta de montaña en buen estado, poco uso.',
    imageUrls: ['https://picsum.photos/seed/bike/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Barcelona', province: 'Barcelona' },
    viewCount: 45,
    favoriteCount: 5,
    tags: ['bicicleta', 'montaña', 'deporte']
  },
  {
    id: 'item_2',
    userId: 'lucia_user_id',
    ownerName: 'Lucía Pérez',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia',
    title: 'Vestido de Fiesta',
    category: 'Moda',
    condition: 'LikeNew',
    wishedItem: 'Libros de arte',
    description: 'Vestido elegante usado solo una vez.',
    imageUrls: ['https://picsum.photos/seed/dress/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Sevilla', province: 'Sevilla' },
    viewCount: 120,
    favoriteCount: 12,
    tags: ['vestido', 'fiesta', 'moda']
  },
  {
    id: 'item_3',
    userId: 'ana_user_id',
    ownerName: 'Ana Martínez',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    title: 'Set de Herramientas',
    category: 'Herramientas',
    condition: 'Acceptable',
    wishedItem: 'Muebles de jardín',
    description: 'Completo set de herramientas manuales.',
    imageUrls: ['https://picsum.photos/seed/tools/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Valencia', province: 'Valencia' },
    viewCount: 30,
    favoriteCount: 2,
    tags: ['herramientas', 'bricolaje']
  },
  {
    id: 'item_4',
    userId: 'miguel_user_id',
    ownerName: 'Miguel Ángel',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel',
    title: 'PlayStation 4',
    category: 'Videojuegos',
    condition: 'Good',
    wishedItem: 'Nintendo Switch',
    description: 'Consola PS4 con dos mandos y 3 juegos.',
    imageUrls: ['https://picsum.photos/seed/ps4/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Zaragoza', province: 'Zaragoza' },
    viewCount: 250,
    favoriteCount: 45,
    tags: ['ps4', 'consola', 'videojuegos']
  },
  {
    id: 'item_5',
    userId: 'elena_user_id',
    ownerName: 'Elena Ruiz',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    title: 'Cámara Reflex Canon',
    category: 'Electrónica',
    condition: 'LikeNew',
    wishedItem: 'Objetivo 50mm',
    description: 'Cámara Canon EOS 80D con objetivo 18-55mm.',
    imageUrls: ['https://picsum.photos/seed/camera/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Málaga', province: 'Málaga' },
    viewCount: 85,
    favoriteCount: 15,
    tags: ['camara', 'canon', 'fotografia']
  },
  {
    id: 'item_troll_1',
    userId: 'troll_user_id',
    ownerName: 'Troll (Demo)',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Troll',
    title: 'ITEM DE SPAM 1',
    category: 'Otros',
    condition: 'Acceptable',
    wishedItem: 'NADA',
    description: 'Este es un item de spam para pruebas de moderación.',
    imageUrls: ['https://picsum.photos/seed/spam/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Madrid', province: 'Madrid' },
    viewCount: 10,
    favoriteCount: 0,
    tags: ['spam', 'troll']
  },
  {
    id: 'item_scammer_1',
    userId: 'scammer_user_id',
    ownerName: 'Scammer (Demo)',
    ownerAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scammer',
    title: 'iPhone 15 Pro Max (FALSO)',
    category: 'Electrónica',
    condition: 'New',
    wishedItem: 'Transferencia bancaria',
    description: 'iPhone 15 Pro Max totalmente nuevo, solo acepto transferencia bancaria directa.',
    imageUrls: ['https://picsum.photos/seed/iphone/800/600'],
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerLocation: { city: 'Barcelona', province: 'Barcelona' },
    viewCount: 500,
    favoriteCount: 0,
    tags: ['iphone', 'estafa', 'scam']
  }
];

export const seedDemoItems = async () => {
  console.log('Checking demo items...');
  const promises = DEMO_ITEMS.map(async (itemData) => {
    try {
      const docRef = doc(db, 'items', itemData.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        console.log(`Seeding item: ${itemData.title}`);
        await setDoc(docRef, itemData);
      }
    } catch (e) {
      console.error(`Error seeding item ${itemData.title}:`, e);
    }
  });
  await Promise.all(promises);
  console.log('Demo items check complete.');
};

export const seedAllData = async () => {
  await seedDemoUsers();
  await seedDemoItems();
};
