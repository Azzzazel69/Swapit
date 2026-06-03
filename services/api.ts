import { ExchangeStatus, ItemCondition } from '../types';
import { CATEGORIES_WITH_SUBCATEGORIES, USER_CATEGORIES } from '../constants';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, sendEmailVerification, applyActionCode } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit, writeBatch, arrayUnion, arrayRemove, documentId, increment, or, runTransaction } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, getStorage } from 'firebase/storage';
import { db, auth, googleProvider, storage } from '../firebase';
import { logAppEvent } from './analytics';
import firebaseConfig from '../firebase-applet-config.json';
import { checkModerationWithAI, ModerationResult } from './geminiService';

export const DEFAULT_AVATAR_NEUTRAL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0UwRTAxMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

const INITIAL_MODERATION_RULES = {
    HARASSMENT: ['puta', 'maricon', 'imbecil', 'subnormal', 'gilipollas', 'estupido', 'mierda', 'basura', 'rata', 'escoria', 'idiota', 'cabron', 'tonto', 'joder', 'coño'],
    DRUGS_SLANG: ['coca', 'perico', 'chocolate', 'costo', 'maria', 'yerba', 'nieve', 'gramos', 'pastis', 'merca', 'camello'],
    ILLEGAL_ITEMS: ['arma', 'pistola', 'cuchillo', 'daga', 'punyal', 'rifle', 'explosivo', 'muni', 'veneno', 'fusil', 'escopeta', 'revolver']
};

enum OperationType { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write' }
function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  let errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('permission-denied') || errorMessage.includes('insufficient permissions')) {
    errorMessage = `Permiso denegado en ${path} (${operationType}). Verifica las reglas de seguridad.`;
  }

  const errInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid || 'no-auth',
      email: auth.currentUser?.email || 'no-email',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || 'no-tenant',
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || 'no-name',
        email: provider.email || 'no-email',
        photoUrl: provider.photoURL || 'no-photo'
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ApiClient {
  token: string | null = null;
  private _isSeeding: boolean = false;

  setToken(token: string | null) { this.token = token; }

  setSeeding(val: boolean) {
    this._isSeeding = val;
  }

  async _checkModeration(text: string): Promise<ModerationResult> {
    return await checkModerationWithAI(text);
  }

  _getCurrentUserId() {
    return auth.currentUser?.uid;
  }

  async clearDatabase(): Promise<void> {

    const baseAdminEmail = 'admin_seeder_v5@test.com';
    const adminPassword = '123456';

    // Use a temporary app to avoid affecting main auth state
    const tempAppName = `temp-admin-clear-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const tempDb = getFirestore(tempApp, firebaseConfig.firestoreDatabaseId);

    try {

      let adminUid = '';
      let adminEmail = baseAdminEmail;
      
      try {
        const cred = await signInWithEmailAndPassword(tempAuth, adminEmail, adminPassword);
        adminUid = cred.user.uid;
      } catch (e: any) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
          console.warn("Admin password mismatch, trying a fresh admin account...");
          adminEmail = `admin_seeder_${Date.now()}@test.com`;
          const cred = await createUserWithEmailAndPassword(tempAuth, adminEmail, adminPassword);
          adminUid = cred.user.uid;
        } else {
          try {
            const cred = await createUserWithEmailAndPassword(tempAuth, adminEmail, adminPassword);
            adminUid = cred.user.uid;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              // This shouldn't happen if we handled wrong-password above, but for safety:
              throw new Error("Admin account exists but password is unknown. Cannot proceed with cleanup.");
            }
            throw createErr;
          }
        }
      }

      const user = tempAuth.currentUser;


      const collections = ['items', 'exchanges', 'chats', 'notifications', 'swipes', 'reports', 'users', 'trust_verifications'];
      const adminUsersQuery = query(collection(tempDb, 'users'), where('role', 'in', ['SUPER_ADMIN', 'ADMIN']));

      for (const colName of collections) {
        try {

          const snap = await getDocs(collection(tempDb, colName));

          
          for (const d of snap.docs) {
            // Skip deleting the current admin user or the main admin email
            if (colName === 'users') {
              const data = d.data();
              if (d.id === user?.uid || data.email === adminEmail || data.email === baseAdminEmail || (data.email && data.email.endsWith('_v5@test.com'))) {

                continue;
              }
            }
            await deleteDoc(doc(tempDb, colName, d.id));
          }
        } catch (colErr: any) {
          console.error(`ApiClient: Error limpiando colección ${colName}:`, colErr);
          // Don't throw immediately for non-critical collections
          if (colName === 'users') throw colErr; 
        }
      }
      
      // Clear Local Storage History
      if (typeof window !== 'undefined' && window.localStorage) {

        window.localStorage.removeItem('swapit_view_history');
        window.localStorage.removeItem('swapit_db_seeded');
      }
      
      await setDoc(doc(tempDb, 'system', 'status'), { seeded: false, updatedAt: new Date() }, { merge: true });

    } catch (err: any) {
      console.error('ApiClient: Error en limpieza aislada:', err);
      throw err;
    } finally {
      await deleteApp(tempApp);
    }
  }

  async getCurrentUser(explicitUid?: string): Promise<any> {
    const uid = explicitUid || this._getCurrentUserId();
    if (!uid) return null;
    
    // Add a retry mechanism to handle race condition when Firestore hasn't yet processed
    // the new authentication token right after signup/login.
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.name === 'Usuario de Prueba' && data.email?.endsWith('@test.com')) {
             let displayName = data.email.split('@')[0].split('_')[0];
             if (data.email === 'pedro_troll_v5@test.com') displayName = 'Pedro Troll';
             else displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
             const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
             await updateDoc(docRef, { name: displayName, avatarUrl: newAvatar });
             data.name = displayName;
             data.avatarUrl = newAvatar;
          }
          return { id: snap.id, ...data };
        } else {
          // Solo recreamos un SUPER_ADMIN si es la cuenta seeder exacta y estamos en DEV
          if (import.meta.env.DEV && auth.currentUser?.email === 'admin_seeder_v5@test.com') {

             const userDoc = {
               name: auth.currentUser?.displayName || 'Admin',
               email: auth.currentUser?.email,
               emailVerified: true,
               phoneVerified: true,
               role: 'SUPER_ADMIN',
               avatarUrl: auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}`,
               createdAt: new Date().toISOString(),
               status: 'ACTIVE',
               needsProfile: false
             };
             await setDoc(docRef, userDoc);
             return { id: uid, ...userDoc };
          } else if (auth.currentUser?.email?.endsWith('@test.com')) {
             let displayName = auth.currentUser.email.split('@')[0].split('_')[0];
             if (auth.currentUser.email === 'pedro_troll_v5@test.com') displayName = 'Pedro Troll';
             else displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

             const userDoc = {
               name: displayName,
               email: auth.currentUser.email,
               emailVerified: true,
               phoneVerified: true,
               role: 'USER',
               avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
               createdAt: new Date().toISOString(),
               status: 'ACTIVE',
               needsProfile: false
             };
             await setDoc(docRef, userDoc);
             return { id: uid, ...userDoc };
          }
        }
        return null;
      } catch (e: any) { 
        lastError = e;
        if (e.code === 'permission-denied' || (e.message && e.message.includes('permission'))) {
           console.warn(`⏳ getCurrentUser permission denied. Retries left: ${retries - 1}`);
           await new Promise(r => setTimeout(r, 500));
           retries--;
        } else {
           throw handleFirestoreError(e, OperationType.GET, 'users');
        }
      }
    }
    throw handleFirestoreError(lastError, OperationType.GET, 'users');
  }

  async seedDemoDatabase(): Promise<void> {
    if (this._isSeeding) return;
    this.setSeeding(true);


    const baseAdminEmail = 'admin_seeder_v5@test.com';
    const adminPassword = '123456';
    
    // Use a temporary app to avoid affecting main auth state
    const tempAppName = `temp-admin-seed-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const tempDb = getFirestore(tempApp, firebaseConfig.firestoreDatabaseId);

    try {

      let adminUid = '';
      let adminEmail = baseAdminEmail;

      // Intentar primero entrar con el admin base
      try {
        const cred = await signInWithEmailAndPassword(tempAuth, adminEmail, adminPassword);
        adminUid = cred.user.uid;
      } catch (e: any) {
        // Si no existe o credenciales inválidas, intentar crearlo
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          try {

            const cred = await createUserWithEmailAndPassword(tempAuth, adminEmail, adminPassword);
            adminUid = cred.user.uid;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              // Si ya existe pero no pudimos entrar (p.ej. password cambiado), usamos uno con timestamp para limpiar
              adminEmail = `admin_seeder_${Date.now()}@test.com`;
              const cred = await createUserWithEmailAndPassword(tempAuth, adminEmail, adminPassword);
              adminUid = cred.user.uid;
            } else {
              throw createErr;
            }
          }
        } else {
          throw e;
        }
      }

      const user = tempAuth.currentUser;


      if (!adminUid) throw new Error("Failed to obtain admin UID for seeding.");

      // 1. Create Admin Doc first to satisfy rules
      await setDoc(doc(tempDb, 'users', adminUid), {
        name: 'Super Admin',
        email: adminEmail,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        createdAt: new Date(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`
      }, { merge: true });

      // 3. Demo Users & Items
      const demoUsers = [
        { email: 'ana_v5@test.com', name: 'Ana García', role: 'USER', preferences: ['Moda', 'Hogar'], location: { lat: 40.4168, lng: -3.7038, address: 'Madrid, España', city: 'Madrid', province: 'Madrid' }, items: [
            { title: 'Vestido de fiesta', category: 'Moda', wishedItem: 'Zapatos', condition: 'New', imageUrls: ['https://loremflickr.com/600/600/dress,clothing'] },
            { title: 'Zapatos de tacón', category: 'Moda', wishedItem: 'Bolso', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/heels,shoes'] },
            { title: 'Lámpara de pie vintage', category: 'Hogar', wishedItem: 'Mesa auxiliar', condition: 'Acceptable', imageUrls: ['https://loremflickr.com/600/600/lamp'] }
        ] },
        { email: 'carlos_v5@test.com', name: 'Carlos Pérez', role: 'USER', preferences: ['Electrónica', 'Deportes'], location: { lat: 41.3851, lng: 2.1734, address: 'Barcelona, España', city: 'Barcelona', province: 'Barcelona' }, items: [
            { title: 'iPhone 13', category: 'Electrónica', wishedItem: 'Samsung S22', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/iphone'] },
            { title: 'PlayStation 4', category: 'Videojuegos', wishedItem: 'Nintendo Switch', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/playstation,console'] },
            { title: 'Raqueta de tenis', category: 'Deportes', wishedItem: 'Zapatillas de tenis', condition: 'Acceptable', imageUrls: ['https://loremflickr.com/600/600/tennisracket'] }
        ] },
        { email: 'laura_v5@test.com', name: 'Laura Ruiz', role: 'USER', preferences: ['Muebles', 'Decoración'], location: { lat: 39.4699, lng: -0.3763, address: 'Valencia, España', city: 'Valencia', province: 'Valencia' }, items: [
            { title: 'Silla ergonómica', category: 'Muebles', wishedItem: 'Escritorio', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/officechair'] },
            { title: 'Mesa de centro de roble', category: 'Muebles', wishedItem: 'Estantería', condition: 'New', imageUrls: ['https://loremflickr.com/600/600/coffeetable'] },
            { title: 'Espejo decorativo', category: 'Hogar', wishedItem: 'Lámpara', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/mirror'] }
        ] },
        { email: 'juan_v5@test.com', name: 'Juan Gómez', role: 'USER', preferences: ['Libros', 'Coleccionismo'], location: { lat: 37.3891, lng: -5.9845, address: 'Sevilla, España', city: 'Sevilla', province: 'Sevilla' }, items: [
            { title: 'Colección de vinilos clásicos', category: 'Otros', wishedItem: 'Tocadiscos', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/vinyl'] },
            { title: 'Libros de fantasía', category: 'Libros', wishedItem: 'Otros libros', condition: 'Acceptable', imageUrls: ['https://loremflickr.com/600/600/books'] },
            { title: 'Cámara analógica antigua', category: 'Coleccionismo', wishedItem: 'Reloj vintage', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/vintagecamera'] }
        ] },
        { email: 'maria_v5@test.com', name: 'María López', role: 'USER', preferences: ['Deportes', 'Moda'], location: { lat: 40.4168, lng: -3.7038, address: 'Madrid, España', city: 'Madrid', province: 'Madrid' }, items: [
            { title: 'Bicicleta de montaña', category: 'Deportes', wishedItem: 'Cámara réflex', condition: 'Acceptable', imageUrls: ['https://loremflickr.com/600/600/mountainbike'] },
            { title: 'Cinta de correr', category: 'Deportes', wishedItem: 'Bicicleta elíptica', condition: 'Good', imageUrls: ['https://loremflickr.com/600/600/treadmill'] },
            { title: 'Chaqueta de cuero', category: 'Moda', wishedItem: 'Botas', condition: 'New', imageUrls: ['https://loremflickr.com/600/600/leatherjacket'] }
        ] },
        { email: 'pedro_troll_v5@test.com', name: 'Pedro Troll', role: 'USER', preferences: ['Spam', 'Molestar'], location: { lat: 40.4168, lng: -3.7038, address: 'Madrid, España', city: 'Madrid', province: 'Madrid' }, items: [
            { title: 'ITEM DE SPAM 1', category: 'Otros', wishedItem: 'NADA', condition: 'Acceptable', imageUrls: ['https://loremflickr.com/600/600/trash'] },
            { title: 'NO COMPRES ESTO', category: 'Otros', wishedItem: 'DINERO', condition: 'Broken', imageUrls: ['https://loremflickr.com/600/600/junk'] },
            { title: 'AAAAAA BBB C', category: 'Electrónica', wishedItem: 'Piedra', condition: 'Acceptable', imageUrls: ['https://loremflickr.com/600/600/error'] }
        ] }
      ];

      for (const u of demoUsers) {
        try {

          let uid = '';
          
          // 1. SIEMPRE intentar crear o conectarse al usuario de Auth

          const userAppName = `user-seed-${u.email.replace(/[@.]/g, '-')}`;
          const userApp = initializeApp(firebaseConfig, userAppName);
          const userAuth = getAuth(userApp);
          
          try {
            const cred = await signInWithEmailAndPassword(userAuth, u.email, '123456');
            uid = cred.user.uid;
          } catch (e: any) {
            if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
              try {
                const cred = await createUserWithEmailAndPassword(userAuth, u.email, '123456');
                uid = cred.user.uid;
              } catch (ce) {
                console.error(`Error creando Auth for ${u.email}:`, ce);
              }
            } else {
              console.error(`Error de login en auth para ${u.email}:`, e);
            }
          }
          await deleteApp(userApp);
          
          if (!uid) {
              console.warn(`ApiClient: Fallo creando/logueando Auth para ${u.email}. Intentando reusar UID de Firestore...`);
              const uq = query(collection(tempDb, 'users'), where('email', '==', u.email));
              const uqSnap = await getDocs(uq);
              if (!uqSnap.empty) {
                uid = uqSnap.docs[0].id;
              }
          }

          if (uid) {
            await setDoc(doc(tempDb, 'users', uid), {
              name: u.name,
              email: u.email,
              emailVerified: true,
              phoneVerified: false, 
              identityVerified: false,
              role: u.role,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
              location: u.location || { lat: 40.4168, lng: -3.7038, address: 'Madrid, España', city: 'Madrid', province: 'Madrid' },
              preferences: u.preferences,
              createdAt: new Date(),
              status: 'ACTIVE',
              isBanned: false,
              needsProfile: false
            }, { merge: true });

            if (u.items) {
              for (const itemData of u.items) {
                const itemId = `item-${u.email.split('_')[0]}-${itemData.title.toLowerCase().replace(/\s/g, '-')}`;

                
                await setDoc(doc(tempDb, 'items', itemId), {
                  title: itemData.title,
                  description: `Artículo demo: ${itemData.title}. Este es un artículo de prueba para la comunidad SwapIt.`,
                  condition: itemData.condition,
                  category: itemData.category,
                  userId: uid,
                  userName: u.name,
                  userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
                  ownerName: u.name,
                  ownerAvatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
                  ownerLocation: u.location || { lat: 40.4168, lng: -3.7038, address: 'Madrid, España', city: 'Madrid', province: 'Madrid' },
                  imageUrls: itemData.imageUrls || [
                    itemData.title.toLowerCase().includes('vestido') ? 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80' :
                    itemData.title.toLowerCase().includes('iphone') ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80' :
                    itemData.title.toLowerCase().includes('silla') ? 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80' :
                    itemData.title.toLowerCase().includes('vinilo') ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80' :
                    itemData.title.toLowerCase().includes('bicicleta') ? 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80' :
                    `https://picsum.photos/seed/${itemData.title.replace(/\s/g, '')}/800/600`
                  ],
                  wishedItem: itemData.wishedItem,
                  status: 'AVAILABLE',
                  moderationStatus: 'APPROVED',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  location: u.location || { lat: 40.4168, lng: -3.7038, address: 'Madrid, España', city: 'Madrid', province: 'Madrid' },
                  viewCount: Math.floor(Math.random() * 100),
                  likes: Math.floor(Math.random() * 20),
                  flagged: false,
                  favoriteCount: Math.floor(Math.random() * 10)
                });
              }
            }
          }
        } catch (err: any) {
          console.warn(`ApiClient: Error seeding ${u.email}:`, err.message);
        }
      }

      await setDoc(doc(tempDb, 'system', 'status'), { seeded: true, updatedAt: new Date() }, { merge: true });
      
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tutorial_completed', 'true');
        window.localStorage.setItem('swapit_db_seeded', 'true');
      }
      

    } catch (err: any) {
      console.error('ApiClient: Error en regeneración aislada:', err);
      throw err;
    } finally {
      await deleteApp(tempApp);
      this.setSeeding(false);
    }
  }

  async login(email, password): Promise<any> {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      
      // If already logged in as this user, just return the token
      if (auth.currentUser?.email === email) {

        return { token: await auth.currentUser.getIdToken() };
      }


      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);

        
        // Small delay to let Auth state propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { token: await cred.user.getIdToken() };
      } catch (e: any) {
        // Auto-seed for demo users if login fails
        if ((e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') && email.endsWith('@test.com')) {

          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);

            
            const userDocRef = doc(db, 'users', cred.user.uid);
            const userSnap = await getDoc(userDocRef);
            
            const isExactDemoSeederEmail = email === 'admin_seeder_v5@test.com';
            let displayName = email.split('@')[0].split('_')[0];
            if (email === 'pedro_troll_v5@test.com') displayName = 'Pedro Troll';
            else displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

            const userData = {
               name: displayName,
               email: email,
               emailVerified: true,
               phoneVerified: true,
               identityVerified: true,
               role: isExactDemoSeederEmail ? 'SUPER_ADMIN' : 'USER',
               avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            };
            
            if (!userSnap.exists()) {
                (userData as any).createdAt = new Date().toISOString();
            }
            
            await setDoc(userDocRef, userData, { merge: true });

            return { token: await cred.user.getIdToken() };
          } catch (createErr: any) {
            console.error(`ApiClient: Failed to auto-create demo user:`, createErr);
            throw e; // Rethrow original login error if creation fails
          }
        }
        throw e;
      }
    } catch (e: any) {
      console.error("Login error code:", e.code, "Message:", e.message);

      let message = 'Error al iniciar sesión';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') 
        message = `Correo o contraseña incorrectos (${e.code})`;
      if (e.code === 'auth/invalid-email') message = 'El formato del correo no es válido';
      if (e.code === 'auth/too-many-requests') message = 'Demasiados intentos fallidos. Por favor, espera unos minutos';
      throw new Error(message);
    }
  }

  async loginWithGoogle(): Promise<any> {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      const cred = await signInWithPopup(auth, googleProvider);
      // We don't create the document here anymore, it will be done in completeRegistration if needed
      return { token: await cred.user.getIdToken() };
    } catch (e) { throw new Error('Error al iniciar sesión con Google'); }
  }

  async updateLastSeen(): Promise<void> {
    const uid = this._getCurrentUserId();
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastSeen: new Date().toISOString()
      });
    } catch (e) {
      // Silently fail for heartbeat
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      console.error('Error sending password reset email:', e);
      throw new Error('Error al enviar el correo de restablecimiento.');
    }
  }

  async verifyEmail(): Promise<void> {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        throw new Error('No hay un usuario autenticado.');
      }
    } catch (e: any) {
      console.error('Error sending verification email:', e);
      throw new Error('Error al enviar el correo de verificación.');
    }
  }

  async _uploadImageIfBase64(imageStr: string, path: string): Promise<string> {
    if (!imageStr || !imageStr.startsWith('data:image')) return imageStr;
    
    // Just return the base64 string directly for all uploads.
    // Images are already resized in the frontend to 420x420 (very small)
    // and Firebase Storage often fails due to CORS or Rules issues
    // causing extreme timeouts (60s+). Firestore can handle up to 1MB per document,
    // and these resized images are highly compressed (~30kb).
    return imageStr;
  }

  async checkPhoneInUse(phone: string): Promise<boolean> {
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const currentUserId = auth.currentUser?.uid;
        const currentUserEmail = auth.currentUser?.email;
        const otherUsers = snap.docs.filter(d => 
          d.id !== currentUserId && d.data().email !== currentUserEmail
        );
        return otherUsers.length > 0;
      }
      return false;
    } catch (e) {
      console.error("Error checking phone", e);
      return false; 
    }
  }

  async register(name, email, password, avatarUrl, location): Promise<any> {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        const actionCodeSettings = typeof window !== 'undefined' ? {
          url: window.location.origin + '/login',
          handleCodeInApp: false
        } : undefined;
        await sendEmailVerification(cred.user, actionCodeSettings);
      } catch (emailErr) {
        console.error('Error sending initial verification email:', emailErr);
      }

      logAppEvent('sign_up', { method: 'email' });
      return { token: await cred.user.getIdToken() };
    } catch (e: any) {
      console.error('Registration error:', e);
      if (e.code === 'auth/email-already-in-use') {
        throw new Error('Ya existe un usuario con este correo.');
      }
      if (e.code === 'auth/invalid-email') {
        throw new Error('El correo electrónico no es válido.');
      }
      if (e.code === 'auth/weak-password') {
        throw new Error('La contraseña es demasiado débil.');
      }
      if (e.code === 'auth/operation-not-allowed') {
        throw new Error('El registro con correo no está activo. Actívalo en la Consola de Firebase (Authentication > Sign-in method > Correo electrónico/contraseña).');
      }
      throw new Error(e.message || 'Error al registrar usuario.');
    }
  }

  private _enrichItemWithOwnerInfo(item: any, ownerData: any) {
    if (!ownerData) return item;
    
    // Ensure location is robust
    const ownerLocation = item.ownerLocation || ownerData.location || null;
    const finalLocation = ownerLocation ? {
      ...ownerLocation,
      city: ownerLocation.city || ownerData.location?.city || 'Madrid',
      province: ownerLocation.province || ownerData.location?.province || 'Madrid',
      address: ownerLocation.address || ownerData.location?.address || 'Madrid, España'
    } : null;

    return {
      ...item,
      ownerName: ownerData.name || (item.ownerName && item.ownerName !== 'Usuario' ? item.ownerName : 'Usuario'),
      ownerAvatarUrl: ownerData.avatarUrl || item.ownerAvatarUrl || DEFAULT_AVATAR_NEUTRAL,
      ownerLocation: finalLocation,
      location: item.location || finalLocation,
      ownerRating: this._calculateUserStats(ownerData).averageRating || 0
    };
  }

  async getUserProfile(uid): Promise<any> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.name === 'Usuario de Prueba' && data.email?.endsWith('@test.com')) {
           let displayName = data.email.split('@')[0].split('_')[0];
           if (data.email === 'pedro_troll_v5@test.com') displayName = 'Pedro Troll';
           else displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
           const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
           await updateDoc(doc(db, 'users', uid), { name: displayName, avatarUrl: newAvatar });
           data.name = displayName;
           data.avatarUrl = newAvatar;
        }
        const items = await this.getUserItems(uid);
        const updatedItems = items.map(item => this._enrichItemWithOwnerInfo(item, data));
        return { id: snap.id, ...data, items: updatedItems };
      }
      throw new Error('Usuario no encontrado');
    } catch (e) { handleFirestoreError(e, OperationType.GET, 'users'); }
  }

  async updateUserProfileData(data): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      if (data.avatarUrl) {
        data.avatarUrl = await this._uploadImageIfBase64(data.avatarUrl, `users/${uid}/avatar`);
      }
      await updateDoc(doc(db, 'users', uid as string), data);
      
      // Update denormalized user data in all their items
      try {
        if (data.avatarUrl || data.name || data.location) {
           const itemsQuery = query(collection(db, 'items'), where('userId', '==', uid));
           const itemsSnap = await getDocs(itemsQuery);
           const batch = writeBatch(db);
           
           const itemUpdates: any = {};
           if (data.name) itemUpdates.ownerName = data.name;
           if (data.avatarUrl) itemUpdates.ownerAvatarUrl = data.avatarUrl;
           if (data.location) itemUpdates.ownerLocation = data.location;
           
           itemsSnap.docs.forEach(itemDoc => {
             batch.update(itemDoc.ref, itemUpdates);
           });
           
           // Also update exchanges
           const exchAsOwnerQ = query(collection(db, 'exchanges'), where('ownerId', '==', uid));
           const exchAsOwnerSnap = await getDocs(exchAsOwnerQ);
           const ownerExchUpdates: any = {};
           if (data.name) ownerExchUpdates.ownerName = data.name;
           if (data.avatarUrl) ownerExchUpdates.ownerAvatarUrl = data.avatarUrl;
           exchAsOwnerSnap.docs.forEach(doc => batch.update(doc.ref, ownerExchUpdates));
           
           const exchAsRequesterQ = query(collection(db, 'exchanges'), where('requesterId', '==', uid));
           const exchAsRequesterSnap = await getDocs(exchAsRequesterQ);
           const reqExchUpdates: any = {};
           if (data.name) reqExchUpdates.requesterName = data.name;
           if (data.avatarUrl) reqExchUpdates.requesterAvatarUrl = data.avatarUrl;
           exchAsRequesterSnap.docs.forEach(doc => batch.update(doc.ref, reqExchUpdates));

           await batch.commit();
        }
      } catch (err) {
        console.warn("Failed to update user items in batch", err);
      }
      
      return await this.getCurrentUser();
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }

  async updateUserPreferences(prefs): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      await updateDoc(doc(db, 'users', uid as string), { preferences: prefs });
      return await this.getCurrentUser();
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }

  async updateUserLocation(loc): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      await updateDoc(doc(db, 'users', uid as string), { location: loc });
      
      try {
         const itemsQuery = query(collection(db, 'items'), where('userId', '==', uid));
         const itemsSnap = await getDocs(itemsQuery);
         const batch = writeBatch(db);
         itemsSnap.docs.forEach(itemDoc => {
           batch.update(itemDoc.ref, { ownerLocation: loc });
         });
         await batch.commit();
      } catch (err) {
        console.warn("Failed to update user items in batch", err);
      }
      
      return await this.getCurrentUser();
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }

  async completeRegistration(userData: { name: string, email: string, avatarUrl?: string, location?: any, preferences?: string[], phone?: string, phoneVerified?: boolean }): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) throw new Error('Usuario no autenticado');
    try {
      let finalAvatarUrl = userData.avatarUrl || DEFAULT_AVATAR_NEUTRAL;
      if (finalAvatarUrl.startsWith('data:image')) {
        finalAvatarUrl = await this._uploadImageIfBase64(finalAvatarUrl, `users/${uid}/avatar`);
      }
      
      // Force reload to get latest emailVerified status
      await auth.currentUser?.reload();
      
      const userDoc = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        emailVerified: auth.currentUser?.emailVerified || false,
        phoneVerified: userData.phoneVerified || false, 
        role: 'USER',
        avatarUrl: finalAvatarUrl,
        location: userData.location || null,
        preferences: userData.preferences || [],
        createdAt: new Date().toISOString(),
        favorites: [],
        following: [],
        ratings: [],
        status: 'ACTIVE',
        needsProfile: false // Explicitly set to false
      };

      await setDoc(doc(db, 'users', uid), userDoc);
      return { id: uid, ...userDoc };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'users');
    }
  }

  async sendEmailVerificationLink(): Promise<any> {
    if (auth.currentUser) {
      try {
        const actionCodeSettings = typeof window !== 'undefined' ? {
          url: window.location.origin + '/login',
          handleCodeInApp: false
        } : undefined;
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        return { success: true };
      } catch (e: any) {
        if (e.code === 'auth/too-many-requests') {
          throw new Error('Has solicitado demasiados correos de verificación. Por favor, espera unos minutos antes de intentarlo de nuevo.');
        }
        throw e;
      }
    }
    throw new Error('Usuario no autenticado');
  }

  async checkEmailVerified(): Promise<any> {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, { emailVerified: true });
        }
        return { verified: true };
      }
      return { verified: false };
    }
    throw new Error('Usuario no autenticado');
  }

  async sendPhoneVerificationCode(phone: string): Promise<any> { 
    const { RecaptchaVerifier, linkWithPhoneNumber } = await import('firebase/auth');
    if (!auth.currentUser) throw new Error("No usuario logueado.");
    
    if (!(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (e) {
        console.error("Recaptcha error:", e);
      }
    }
    
    const appVerifier = (window as any).recaptchaVerifier;
    try {
        // Enlazar el teléfono a la cuenta de email
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, phone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      return { success: true };
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || 'Error al enviar el SMS.');
    }
  }

  async verifyPhoneCode(code: string): Promise<any> { 
    const confirmationResult = (window as any).confirmationResult;
    if (!confirmationResult) throw new Error("No se ha enviado ningún código.");
    try {
      await confirmationResult.confirm(code);
      return true;
    } catch (e: any) {
      throw new Error("Código inválido o ha expirado.");
    }
  }
  async canEditProfile(): Promise<any> { return { canEdit: true, reason: null }; }
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<any> {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (e: any) {
      throw new Error(e.message || "Error updating password");
    }
  }
  async toggleFollowUser(userIdToFollow: string): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) throw new Error('No autenticado');
    if (uid === userIdToFollow) throw new Error('No puedes seguirte a ti mismo');
    
    try {
      const currentUserRef = doc(db, 'users', uid);
      const targetUserRef = doc(db, 'users', userIdToFollow);
      
      const [snap, targetSnap] = await Promise.all([
        getDoc(currentUserRef),
        getDoc(targetUserRef)
      ]);
      
      if (!targetSnap.exists()) throw new Error('El usuario a seguir no existe');
      if (!snap.exists()) throw new Error('Usuario no encontrado');
      
      const following = snap.data()?.following || [];
      const isFollowing = following.includes(userIdToFollow);
      
      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(userIdToFollow) });
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(userIdToFollow) });
      }
      
      return { success: true, isFollowing: !isFollowing };
    } catch (e) { 
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }
  async requestTrustVerification(platform: string, username: string): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) throw new Error('No autenticado');
    
    // Generate a unique verification code
    const verificationCode = `SWAPIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    try {
      const verificationRequest = {
        uid,
        platform,
        username,
        verificationCode,
        status: 'PENDING_USER_ACTION',
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'trust_verifications', uid), verificationRequest);
      return { success: true, verificationCode };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'trust_verifications');
    }
  }

  async confirmTrustVerification(): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) throw new Error('No autenticado');
    
    try {
      const docRef = doc(db, 'trust_verifications', uid);
      const snap = await getDoc(docRef);
      
      if (!snap.exists()) throw new Error('No hay una solicitud pendiente');
      
      // Verification should be done in backend
      await updateDoc(docRef, { status: 'PENDING', updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', uid), { identityVerificationStatus: 'PENDING', updatedAt: serverTimestamp() });
      
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      return { id: uid, ...userSnap.data() };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'trust_verifications');
    }
  }
  async assignRole(uid, role): Promise<any> {
    try { await updateDoc(doc(db, 'users', uid), { role }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }
  async banUser(uid, reason): Promise<any> {
    try { await updateDoc(doc(db, 'users', uid), { status: 'BANNED', isBanned: true, banReason: reason }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }
  async unbanUser(uid): Promise<any> {
    try { await updateDoc(doc(db, 'users', uid), { status: 'ACTIVE', isBanned: false }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }
  
  async deleteUserAdmin(uid: string): Promise<void> {
    try {
      const itemsQuery = query(collection(db, 'items'), where('userId', '==', uid));
      const itemsSnap = await getDocs(itemsQuery);
      
      const batch = writeBatch(db);
      
      itemsSnap.docs.forEach(itemDoc => {
        batch.delete(itemDoc.ref);
      });
      
      batch.delete(doc(db, 'users', uid));
      
      await batch.commit();
      
    } catch (e: any) { 
      console.error("Delete user failed! ", e);
      handleFirestoreError(e, OperationType.DELETE, 'users'); 
    }
  }
  
  async getAllUsersAdmin(): Promise<any> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'users'); }
  }

  async getAllItemsAdmin(): Promise<any> {
    try {
      const snap = await getDocs(collection(db, 'items'));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const db = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return db - da; 
      });
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'items'); }
  }
  async verifyEmailWithToken(token): Promise<any> {
    try {
      await applyActionCode(auth, token);
      return { success: true };
    } catch (e) {
      throw new Error('El enlace es inválido o ha expirado.');
    }
  }
  async saveFcmToken(token): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: token,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error saving FCM token:', e);
    }
  }
  
  _calculateUserStats(user): any {
    if (!user || !user.ratings) return { averageRating: 0, totalRatings: 0, trustScore: 0 };
    const total = user.ratings.length;
    const avg = total > 0 ? user.ratings.reduce((acc, r) => acc + r.rating, 0) / total : 0;
    let trust = avg;
    if (user.identityVerified) trust += 10;
    if (user.phoneVerified) trust += 5;
    return { averageRating: avg, totalRatings: total, trustScore: Math.min(100, trust) };
  }

  // Items
  async createItem(data): Promise<any> {
    const uid = this._getCurrentUserId();
    
    const titleMod = await this._checkModeration(data.title);
    if (!titleMod.passed) throw new Error(`El contenido no cumple con las normas: ${titleMod.reason}`);
    
    const descMod = await this._checkModeration(data.description);
    if (!descMod.passed) throw new Error(`El contenido no cumple con las normas: ${descMod.reason}`);

    try {
      const user = await this.getCurrentUser();
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        data.imageUrls = await Promise.all(data.imageUrls.map((url: string) => this._uploadImageIfBase64(url, `items/${uid}`)));
      }
      const itemData = {
        ...data,
        userId: uid,
        ownerName: user?.name || 'Usuario',
        ownerAvatarUrl: user?.avatarUrl || DEFAULT_AVATAR_NEUTRAL,
        ownerLocation: user?.location || null,
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        flagged: false,
        viewCount: 0,
        favoriteCount: 0
      };
      const docRef = await addDoc(collection(db, 'items'), itemData);
      logAppEvent('item_created', { category: data.category });
      return { id: docRef.id, ...itemData };
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'items'); }
  }

  async updateItem(itemId, data): Promise<any> {
    if (data.title) {
        const titleMod = await this._checkModeration(data.title);
        if (!titleMod.passed) throw new Error(`El contenido no cumple con las normas: ${titleMod.reason}`);
    }
    if (data.description) {
        const descMod = await this._checkModeration(data.description);
        if (!descMod.passed) throw new Error(`El contenido no cumple con las normas: ${descMod.reason}`);
    }

    try {
      const uid = this._getCurrentUserId();
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        data.imageUrls = await Promise.all(data.imageUrls.map((url: string) => this._uploadImageIfBase64(url, `items/${uid}`)));
      }
      await updateDoc(doc(db, 'items', itemId), data);
      return await this.getItemById(itemId);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'items'); }
  }

  async deleteItem(itemId): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) throw new Error("No autenticado");
    try {
      const itemSnap = await getDoc(doc(db, 'items', itemId));
      if (!itemSnap.exists()) throw new Error("Artículo no encontrado");
      if (itemSnap.data().userId !== uid) throw new Error("No tienes permiso para borrar este artículo");
      await deleteDoc(doc(db, 'items', itemId));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'items'); }
  }

  async incrementViewCount(itemId): Promise<void> {
    try {
      await updateDoc(doc(db, 'items', itemId), { viewCount: increment(1) });
    } catch (e) {
      console.warn('Error al incrementar viewCount:', e);
    }
  }

  async getItemById(id): Promise<any> {
    if (!id) throw new Error('ID de item no proporcionado');
    try {

      const snap = await getDoc(doc(db, 'items', id));
      if (snap.exists()) {
        const item = { id: snap.id, ...(snap.data() as any) };
        if (item.userId) {
          try {
            const uSnap = await getDoc(doc(db, 'users', item.userId));
            if (uSnap.exists()) {
              return this._enrichItemWithOwnerInfo(item, uSnap.data());
            }
          } catch (e) { console.error("Error fetching user for item", e); }
        }
        return item;
      }
      console.warn(`ApiClient: Item no encontrado en Firestore: ${id}`);
      return null;
    } catch (e) { 
      console.error(`ApiClient: Error en getItemById(${id}):`, e);
      handleFirestoreError(e, OperationType.GET, 'items'); 
    }
  }

  async getUserItems(uid): Promise<any> {
    try {
      const q = query(collection(db, 'items'), where('userId', '==', uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'items'); }
  }

  /**
   * Obtiene los datos para la página principal.
   * TODO: Implementar paginación real de Firestore (cursores con startAfter)
   * Actualmente se utiliza un limit(100) temporal sin paginación visible, 
   * lo cual no pagina verdaderamente los resultados en el backend.
   */
  async getHomePageData(params: any = {}): Promise<any> {
    const userId = this._getCurrentUserId();
    try {
      // 1. Get all available items
      let allItems = [];
      try {
        const q = query(collection(db, 'items'), where('status', '==', 'AVAILABLE'), limit(100));
        const snap = await getDocs(q);
        allItems = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        allItems.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        
        // Always fetch the latest user data for items to ensure avatars/names remain highly synced
        const itemsToEnrich = allItems;
        if (itemsToEnrich.length > 0) {
          const uniqueUserIds = [...new Set(itemsToEnrich.map(i => i.userId))];
          const usersData: Record<string, any> = {};
          
          // Chunk uniqueUserIds into arrays of max 30 to respect Firestore 'in' query limits
          const chunks = [];
          for (let i = 0; i < uniqueUserIds.length; i += 30) {
            chunks.push(uniqueUserIds.slice(i, i + 30));
          }
          
          await Promise.all(chunks.map(async (chunk) => {
            try {
              const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
              const snap = await getDocs(q);
              snap.docs.forEach(d => {
                usersData[d.id] = d.data();
              });
            } catch (e) {
              console.error("Error fetching users chunk", e);
            }
          }));
          
          allItems = allItems.map(item => {
            const u = usersData[item.userId];
            if (u) {
              return this._enrichItemWithOwnerInfo(item, u);
            }
            return item;
          });
        }
      } catch (e) {
        console.error("Error fetching all items:", e);
        handleFirestoreError(e, OperationType.LIST, 'items');
      }
      
      if (!userId) {
        return { 
          exploreItems: allItems, 
          directMatches: [], 
          recommended: [], 
          nearItems: [], 
          favoriteItems: [], 
          popularItems: allItems.slice(0, 6), 
          totalExploreItems: allItems.length 
        };
      }

      // 2. Get user's items and preferences
      let userData: any = {};
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        userData = userSnap.data() || {};
      } catch (e) {
        console.error("Error fetching user data:", e);
      }
      
      const userPreferences = userData.preferences || [];
      const userCity = userData.location?.city;
      
      let userItems = [];
      try {
        const myItemsSnap = await getDocs(query(collection(db, 'items'), where('userId', '==', userId)));
        userItems = myItemsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      } catch (e) {
        console.error("Error fetching user items:", e);
      }
      
      // 4. Filter out own items
      const otherItems = allItems.filter(i => i.userId !== userId);

      // 5. Intelligent Matching via Backend (Gemini API)
      let aiMatches: Record<string, string> = {};
      let aiFailed = false;
      if (userItems.length > 0 && otherItems.length > 0) {
        try {
          // Send simplified version of items to save bandwidth and token size
          const payload = {
             userItems: userItems.map(i => ({ id: i.id, title: i.title, category: i.category, description: i.description })),
             otherItems: otherItems.map(i => ({ id: i.id, wishedItem: i.wishedItem }))
          };
          const response = await fetch('/api/batch-check-match', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
          });
          if (response.ok) {
             const data = await response.json();
             aiMatches = data.matches || {};
             if (data.aiFailed) aiFailed = true;
          } else {
             aiFailed = true;
          }
        } catch (matchErr) {
          console.error("Failed to fetch AI matches", matchErr);
          aiFailed = true;
        }
      }

      const checkMatchFallback = (item: any, myItems: any[]) => {
        if (!item.wishedItem || typeof item.wishedItem !== 'string') return null;
        
        const stopWords = new Set([
          'con', 'sin', 'para', 'por', 'como', 'muy', 'mas', 'que', 'del',
          'busco', 'quiero', 'necesito', 'cambio', 'gustaria', 'algun', 'alguna',
          'cualquier', 'cualquiera', 'preferiblemente', 'buscando', 'tiene', 'tenga',
          'uno', 'una', 'unos', 'unas', 'este', 'esta', 'ese', 'esa', 'buen', 'bueno', 'buena',
          'excelente', 'estado', 'perfecto', 'interesa', 'interesan'
        ]);

        const normalizeStr = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const searchTerms = normalizeStr(item.wishedItem)
          .split(/[\s,]+/)
          .filter(t => t.length >= 3 && !stopWords.has(t));
        
        if (searchTerms.length === 0) return null;
        
        const matchingItem = myItems.find(ui => {
          const title = normalizeStr(ui.title || "");
          const cat = normalizeStr(ui.category || "");
          const desc = normalizeStr(ui.description || "");

          const searchArea = `${title} ${cat} ${desc}`;

          // Evitar falsos positivos directos de antonimos con una heuristica simple
          const hasBig = searchTerms.some(t => ['grande', 'amplio', 'enorme'].includes(t));
          const hasSmall = searchTerms.some(t => ['pequeno', 'chico', 'mini'].includes(t));
          const itemHasBig = ['grande', 'amplio', 'enorme'].some(t => searchArea.includes(t));
          const itemHasSmall = ['pequeno', 'chico', 'mini'].some(t => searchArea.includes(t));

          if (hasBig && itemHasSmall) return false;
          if (hasSmall && itemHasBig) return false;

          const hasNew = searchTerms.some(t => ['nuevo', 'nueva', 'precintado', 'estrenar'].includes(t));
          const hasOld = searchTerms.some(t => ['viejo', 'vieja', 'usado', 'roto', 'desgaste'].includes(t));
          const itemHasNew = ['nuevo', 'nueva', 'precintado', 'estrenar'].some(t => searchArea.includes(t));
          const itemHasOld = ['viejo', 'vieja', 'usado', 'roto', 'desgaste'].some(t => searchArea.includes(t));

          if (hasNew && itemHasOld) return false;
          if (hasOld && itemHasNew) return false;

          const matchingTerms = searchTerms.filter(term => title.includes(term) || cat.includes(term));
          
          const matchRatio = matchingTerms.length / searchTerms.length;
          
          return matchRatio >= 0.6;
        });

        return matchingItem ? matchingItem.id : null;
      };

      // Apply isMatch to all items
      const itemsWithMatchInfo = otherItems.map(item => {
        let matchingItemId = null;
        if (!aiFailed) {
            matchingItemId = aiMatches[item.id] || null;
        } else {
            matchingItemId = checkMatchFallback(item, userItems);
        }
        return {
          ...item,
          isMatch: !!matchingItemId,
          matchingItemId: matchingItemId
        };
      });

      const directMatches = itemsWithMatchInfo.filter(i => i.isMatch);
      
      // Recommended: Items in user's preferred categories
      const recommended = itemsWithMatchInfo.filter(item => 
        !item.isMatch && userPreferences.some((pref: string) => 
          item.category?.toLowerCase().includes(pref.toLowerCase()) || 
          item.title?.toLowerCase().includes(pref.toLowerCase())
        )
      );

      // Near Items: Items in the same city
      const nearItems = itemsWithMatchInfo.filter(item => 
        !item.isMatch && userCity && item.ownerLocation?.city?.toLowerCase() === userCity.toLowerCase()
      );

      // Popular Items: Based on viewCount or favoriteCount
      const popularItems = [...itemsWithMatchInfo]
        .filter(i => !i.isMatch)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 10);

      // Favorite Items: Items the user has favorited
      const userFavorites = userData.favorites || [];
      const favoriteItems = allItems.filter(item => userFavorites.includes(item.id));

      return { 
        exploreItems: itemsWithMatchInfo.length > 0 ? itemsWithMatchInfo : otherItems, 
        directMatches: directMatches, 
        recommended: recommended, 
        nearItems: nearItems, 
        favoriteItems: favoriteItems, 
        popularItems: popularItems, 
        totalExploreItems: itemsWithMatchInfo.length 
      };
    } catch (e) { 
      console.error("Critical error in getHomePageData:", e);
      handleFirestoreError(e, OperationType.LIST, 'home_page_data'); 
    }
  }

  async toggleFavorite(itemId: string): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      const itemRef = doc(db, 'items', itemId);
      
      const { isFavorite } = await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const itemSnap = await transaction.get(itemRef);
        
        if (!userSnap.exists() || !itemSnap.exists()) {
          throw new Error("User or Item does not exist");
        }
        
        const favs = userSnap.data().favorites || [];
        const isFav = favs.includes(itemId);
        let currentCount = itemSnap.data().favoriteCount || 0;
        
        if (isFav) {
          transaction.update(userRef, { favorites: arrayRemove(itemId) });
          transaction.update(itemRef, { favoriteCount: Math.max(0, currentCount - 1) });
        } else {
          transaction.update(userRef, { favorites: arrayUnion(itemId) });
          transaction.update(itemRef, { favoriteCount: currentCount + 1 });
        }
        
        return { isFavorite: !isFav };
      });
      
      const updatedItem = await this.getItemById(itemId);
      return { item: updatedItem, isFavorite };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'favorites'); }
  }

  async getExplorationItems(): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const q = query(collection(db, 'items'), where('status', '==', 'AVAILABLE'));
      const snap = await getDocs(q);
      let allItems = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      const swipedQ = query(collection(db, 'swipes'), where('userId', '==', uid));
      const swipedSnap = await getDocs(swipedQ);
      const swipedIds = swipedSnap.docs.map(d => d.data().itemId);

      let filteredItems = allItems.filter(item => 
        item.userId !== uid && !swipedIds.includes(item.id)
      );

      // Fallback for demo: if no unswiped items, show others
      filteredItems = filteredItems.length > 0 ? filteredItems : allItems.filter(i => i.userId !== uid);

      // Shuffle items for a more dynamic experience
      filteredItems = filteredItems.sort(() => Math.random() - 0.5);

      // Always fetch the latest user data for items to ensure avatars are up to date
      const itemsToEnrich = filteredItems;
      if (itemsToEnrich.length > 0) {
          const uniqueUserIds = [...new Set(itemsToEnrich.map(i => i.userId))];
          const usersData: Record<string, any> = {};
          
          await Promise.all(uniqueUserIds.map(async (userId) => {
            try {
              const uSnap = await getDoc(doc(db, 'users', userId));
              if (uSnap.exists()) {
                usersData[userId] = uSnap.data();
              }
            } catch (e) {
              console.error("Error fetching user", userId, e);
            }
          }));

          filteredItems = filteredItems.map(item => {
            const u = usersData[item.userId];
            if (u) {
              return {
                ...item,
                ownerName: u.name || (item.ownerName && item.ownerName !== 'Usuario' ? item.ownerName : 'Usuario'),
                ownerAvatarUrl: u.avatarUrl || item.ownerAvatarUrl || DEFAULT_AVATAR_NEUTRAL,
                ownerLocation: u.location || item.ownerLocation || null
              };
            }
            return item;
          });
      }

      return filteredItems;
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'items'); }
  }

  async swipeItem(itemId, type): Promise<any> {
    const uid = this._getCurrentUserId();
    const normalizedType = type.toLowerCase();
    try {
      // Record the swipe
      await addDoc(collection(db, 'swipes'), {
        userId: uid,
        itemId: itemId,
        type: normalizedType, // 'like' or 'dislike'
        timestamp: new Date()
      });

      if (normalizedType === 'like') {
        logAppEvent('swipe_like', { itemId });
        
        // Update the item's like count
        try {
          await updateDoc(doc(db, 'items', itemId), {
            likes: increment(1)
          });
        } catch (updateErr) {
          console.warn("Could not increment likes on item:", updateErr);
        }

        // Check for a match (simplified: check if the owner of the item has liked any of my items)
        const itemSnap = await getDoc(doc(db, 'items', itemId));
        if (itemSnap.exists()) {
          const itemOwnerId = itemSnap.data().userId;
          
          // Get my items
          const myItemsSnap = await getDocs(query(collection(db, 'items'), where('userId', '==', uid)));
          const myItemIds = myItemsSnap.docs.map(d => d.id);
          
          if (myItemIds.length > 0) {
            // Check if itemOwnerId has liked any of my items
            const matchQuery = query(
              collection(db, 'swipes'), 
              where('userId', '==', itemOwnerId),
              where('type', '==', 'like'),
              where('itemId', 'in', myItemIds)
            );
            const matchSnap = await getDocs(matchQuery);
            
            if (!matchSnap.empty) {
              const matchedSwipe = matchSnap.docs[0].data();
              const matchedItemId = matchedSwipe.itemId;
              
              // Fetch matched item details
              const matchedItemSnap = await getDoc(doc(db, 'items', matchedItemId));
              const matchedItem = matchedItemSnap.exists() ? { id: matchedItemSnap.id, ...matchedItemSnap.data() } : null;

              // Create an exchange automatically for the match
              const exchangeData = {
                ownerId: itemOwnerId,
                requesterId: uid,
                requestedItemId: itemId,
                offeredItemIds: [matchedItemId],
                offeredOtherItems: [],
                cashPlus: 0,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                lastMessage: '¡Es un match! Empezad a hablar sobre el intercambio.',
                lastMessageAt: new Date().toISOString()
              };
              const exchangeRef = await addDoc(collection(db, 'exchanges'), exchangeData);

              // Create initial chat
              await setDoc(doc(db, 'chats', exchangeRef.id), {
                exchangeId: exchangeRef.id,
                messages: [{
                  id: 'm1',
                  senderId: 'system',
                  text: '¡Es un match! Empezad a hablar sobre el intercambio.',
                  timestamp: new Date().toISOString()
                }]
              });

              logAppEvent('match_created', { itemId });
              return { 
                match: true, 
                isMatch: true, 
                matchedItemId, 
                matchedItem,
                exchangeId: exchangeRef.id
              };
            }
          }
        }
      }
      return { match: false, isMatch: false };
    } catch (e) { 
      // handleFirestoreError(e, OperationType.CREATE, 'swipes'); 
      // Return false on error to not break the UI
      return { match: false, isMatch: false };
    }
  }

  async resizeImageBeforeUpload(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = objectUrl;
            video.muted = true;
            video.playsInline = true;
            
            video.onloadeddata = () => {
                // Seek to 1 second to avoid blank first frames
                video.currentTime = 1; 
            };
            
            video.onseeked = () => {
                URL.revokeObjectURL(objectUrl);
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 420;
                const MAX_HEIGHT = 420;
                let width = video.videoWidth;
                let height = video.videoHeight;

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

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Draw white background or play icon placeholder
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(0, 0, width, height);
                ctx?.drawImage(video, 0, 0, width, height);
                
                // Add a play button overlay to indicate it's a video
                if (ctx) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.beginPath();
                    ctx.arc(width/2, height/2, 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.moveTo(width/2 - 10, height/2 - 15);
                    ctx.lineTo(width/2 + 15, height/2);
                    ctx.lineTo(width/2 - 10, height/2 + 15);
                    ctx.fill();
                }

                resolve(canvas.toDataURL('image/jpeg', 0.5));
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("No se pudo procesar el vídeo."));
            };
            return;
        }

        const img = new Image();
        
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 420;
            const MAX_HEIGHT = 420;
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

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.5 quality to ensure small size and fast upload
            resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("No se pudo procesar la imagen (formato inválido o corrupto)."));
        };
        img.src = objectUrl;
    });
  }

  // Exchanges & Chats
  async createExchangeProposal(data): Promise<any> {
    const uid = this._getCurrentUserId();
    const user = await this.getCurrentUser();
    
    if (data.message) {
      const mod = await this._checkModeration(data.message);
      if (!mod.passed) {
        throw new Error(`El mensaje inicial no cumple con las normas: ${mod.reason}`);
      }
    }
    
    try {
      const itemSnap = await getDoc(doc(db, 'items', data.requestedItemId));
      if (!itemSnap.exists()) throw new Error("Artículo no encontrado");
      const requestedItem = itemSnap.data();
      if (requestedItem?.status === 'RESERVED' || requestedItem?.status === 'EXCHANGED') {
        throw new Error("El artículo ya no está disponible para intercambio.");
      }
      const ownerId = requestedItem?.userId;
      if (!ownerId) throw new Error("Propietario no encontrado");
      
      if (ownerId === uid) {
        throw new Error("No puedes proponer un intercambio por tu propio artículo.");
      }
      
      const ownerSnap = await getDoc(doc(db, 'users', ownerId));
      
      const batch = writeBatch(db);
      const docRef = doc(collection(db, 'exchanges'));
      
      batch.set(docRef, {
        requestedItemId: data.requestedItemId,
        offeredItemIds: data.offeredItemIds || [],
        offeredOtherItems: data.otherItems || [],
        ownerId,
        requesterId: uid,
        status: 'PENDING',
        cashPlus: data.cashPlus || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ownerName: ownerSnap.data()?.name || 'Usuario',
        ownerAvatarUrl: ownerSnap.data()?.avatarUrl || null,
        requesterName: (user as any)?.name || 'Usuario',
        requesterAvatarUrl: (user as any)?.avatarUrl || null,
        lastMessage: data.message || 'Hola, me interesa este intercambio.',
        lastMessageAt: serverTimestamp(),
        unreadCount: 1
      });
      
      // Create chat
      batch.set(doc(db, 'chats', docRef.id), {
        exchangeId: docRef.id,
        messages: [{ id: 'm1', senderId: uid, text: data.message || 'Hola, me interesa este intercambio.', timestamp: new Date().toISOString() }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create notification
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: ownerId,
        type: 'EXCHANGE_PROPOSAL',
        title: 'Nueva propuesta de trueque',
        message: `${(user as any)?.name || 'Alguien'} quiere intercambiar tu artículo.`,
        data: { exchangeId: docRef.id },
        read: false,
        createdAt: serverTimestamp()
      });
      
      await batch.commit();

      return { id: docRef.id };
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'exchanges'); }
  }

  async updateExchangeStatus(exchangeId, status, cancelReason?: string): Promise<any> {
    try {
      const uid = this._getCurrentUserId();
      const exSnap = await getDoc(doc(db, 'exchanges', exchangeId));
      if (!exSnap.exists()) throw new Error('Exchange not found');
      
      const exchangeData = exSnap.data() as any;
      if (exchangeData.ownerId !== uid && exchangeData.requesterId !== uid) {
        throw new Error('No estás autorizado para modificar este intercambio');
      }
      
      const isOwner = exchangeData.ownerId === uid;
      const newStatus = String(status).toUpperCase();
      
      // Permitir sólo transiciones válidas según rol
      if (newStatus === 'ACCEPTED' && !isOwner) {
        throw new Error('Solo el propietario puede aceptar el intercambio');
      }
      if (newStatus === 'REJECTED' && !isOwner) {
        throw new Error('Solo el propietario puede rechazar la solicitud de intercambio');
      }
      if (newStatus === 'CANCELLED') {
        if (exchangeData.status === 'PENDING' && isOwner) {
          throw new Error('Como propietario debes Rechazar (REJECT) el intercambio en lugar de Cancelarlo.');
        }
        if (exchangeData.status === 'COMPLETED' || exchangeData.status === 'CANCELLED' || exchangeData.status === 'REJECTED') {
          throw new Error('No puedes cancelar un intercambio que ya está finalizado.');
        }
      }
      
      const partnerId = exchangeData.ownerId === uid ? exchangeData.requesterId : exchangeData.ownerId;
      
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'exchanges', exchangeId), { 
        status: String(status).toUpperCase(),
        cancelReason: cancelReason || null,
        updatedAt: serverTimestamp()
      });

      let title = "";
      let message = "";
      let notifType = "EXCHANGE_UPDATE";
      
      if (String(status).toUpperCase() === 'ACCEPTED') {
         title = "¡Propuesta de Trueque Aceptada!";
         message = "Tus artículos han sido aceptados. Entra al chat para concretar el punto de entrega.";
         notifType = "EXCHANGE_ACCEPTED";
         
         // Mark items as RESERVED
         if (exchangeData.requestedItemId) batch.update(doc(db, 'items', exchangeData.requestedItemId), { status: 'RESERVED', exchangeId: exchangeId, updatedAt: serverTimestamp() });
         if (exchangeData.offeredItemId) batch.update(doc(db, 'items', exchangeData.offeredItemId), { status: 'RESERVED', exchangeId: exchangeId, updatedAt: serverTimestamp() });
         if (exchangeData.offeredItemIds && exchangeData.offeredItemIds.length > 0) {
           exchangeData.offeredItemIds.forEach((id: string) => batch.update(doc(db, 'items', id), { status: 'RESERVED', exchangeId: exchangeId, updatedAt: serverTimestamp() }));
         }
      } else if (String(status).toUpperCase() === 'REJECTED') {
         title = "Propuesta Rechazada";
         message = "Lamentablemente tu propuesta no ha sido aceptada.";
         notifType = "EXCHANGE_REJECTED";
         // Free items back to AVAILABLE
         if (exchangeData.requestedItemId) batch.update(doc(db, 'items', exchangeData.requestedItemId), { status: 'AVAILABLE', exchangeId: exchangeId, updatedAt: serverTimestamp() });
         if (exchangeData.offeredItemId) batch.update(doc(db, 'items', exchangeData.offeredItemId), { status: 'AVAILABLE', exchangeId: exchangeId, updatedAt: serverTimestamp() });
         if (exchangeData.offeredItemIds && exchangeData.offeredItemIds.length > 0) {
           exchangeData.offeredItemIds.forEach((id: string) => batch.update(doc(db, 'items', id), { status: 'AVAILABLE', exchangeId: exchangeId, updatedAt: serverTimestamp() }));
         }
      } else if (String(status).toUpperCase() === 'CANCELLED') {
         title = "Propuesta Cancelada";
         message = "La transacción ha sido cancelada." + (cancelReason ? ` Motivo: ${cancelReason}` : "");
         notifType = "EXCHANGE_CANCELLED";
         // Free items back to AVAILABLE
         if (exchangeData.requestedItemId) batch.update(doc(db, 'items', exchangeData.requestedItemId), { status: 'AVAILABLE', exchangeId: exchangeId, updatedAt: serverTimestamp() });
         if (exchangeData.offeredItemId) batch.update(doc(db, 'items', exchangeData.offeredItemId), { status: 'AVAILABLE', exchangeId: exchangeId, updatedAt: serverTimestamp() });
         if (exchangeData.offeredItemIds && exchangeData.offeredItemIds.length > 0) {
           exchangeData.offeredItemIds.forEach((id: string) => batch.update(doc(db, 'items', id), { status: 'AVAILABLE', exchangeId: exchangeId, updatedAt: serverTimestamp() }));
         }
      } else if (String(status).toUpperCase() === 'COMPLETED') {
         title = "Intercambio Completado";
         message = "El intercambio ha finalizado con éxito. ¡Enhorabuena!";
         notifType = "EXCHANGE_COMPLETED";
         // Make sure items stay EXCHANGED (logic is also in completeExchange, but just in case)
      }
      
      if (title) {
         const notifRef = doc(collection(db, 'notifications'));
         batch.set(notifRef, {
           userId: partnerId,
           type: notifType,
           title: title,
           message: message,
           data: { exchangeId: exchangeId },
           read: false,
           createdAt: serverTimestamp()
         });
      }

      await batch.commit();

      if (String(status).toUpperCase() === 'CANCELLED' && cancelReason) {
         // Also append a system message to the chat
         await this.sendMessage(exchangeId, `La transacción ha sido cancelada. Motivo: ${cancelReason}`, null, partnerId);
      }

      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'exchanges'); }
  }

  async getUserPastExchanges(uid): Promise<any> {
    try {
      const q = query(collection(db, 'exchanges'), or(where('ownerId', '==', uid), where('requesterId', '==', uid)));
      const s = await getDocs(q);
      let exchanges = s.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      const partnerIds = [...new Set(exchanges.map(ex => ex.ownerId === uid ? ex.requesterId : ex.ownerId))];
      const usersData: Record<string, any> = {};
      try {
        await Promise.all(partnerIds.map(async (pId) => {
           if (pId) {
               const uSnap = await getDoc(doc(db, 'users', pId));
               if (uSnap.exists()) {
                   usersData[pId] = uSnap.data();
               }
           }
        }));
        exchanges = exchanges.map(ex => {
            const partnerId = ex.ownerId === uid ? ex.requesterId : ex.ownerId;
            const u = usersData[partnerId];
            if (u) {
                return {
                    ...ex,
                    ownerAvatarUrl: ex.ownerId === partnerId ? (u.avatarUrl || ex.ownerAvatarUrl) : ex.ownerAvatarUrl,
                    requesterAvatarUrl: ex.requesterId === partnerId ? (u.avatarUrl || ex.requesterAvatarUrl) : ex.requesterAvatarUrl,
                };
            }
            return ex;
        });
      } catch (e) {
          console.error("Error enriching exchanges with user data", e);
      }
      
      const pastExchanges = exchanges.filter(ex => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ex.status));
      return pastExchanges.sort((a, b) => {
         const tA = a.updatedAt?.toDate()?.getTime() || a.createdAt?.toDate()?.getTime() || 0;
         const tB = b.updatedAt?.toDate()?.getTime() || b.createdAt?.toDate()?.getTime() || 0;
         return tB - tA;
      });
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'exchanges'); }
  }

  async getExchanges(): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const q = query(collection(db, 'exchanges'), or(where('ownerId', '==', uid), where('requesterId', '==', uid)));
      const s = await getDocs(q);
      let exchanges = s.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      const partnerIds = [...new Set(exchanges.map(ex => ex.ownerId === uid ? ex.requesterId : ex.ownerId))];
      const usersData: Record<string, any> = {};
      try {
        await Promise.all(partnerIds.map(async (pId) => {
           if (pId) {
               const uSnap = await getDoc(doc(db, 'users', pId));
               if (uSnap.exists()) {
                   usersData[pId] = uSnap.data();
               }
           }
        }));
        exchanges = exchanges.map(ex => {
            const partnerId = ex.ownerId === uid ? ex.requesterId : ex.ownerId;
            const u = usersData[partnerId];
            if (u) {
                return {
                    ...ex,
                    ownerAvatarUrl: ex.ownerId === partnerId ? (u.avatarUrl || ex.ownerAvatarUrl) : ex.ownerAvatarUrl,
                    requesterAvatarUrl: ex.requesterId === partnerId ? (u.avatarUrl || ex.requesterAvatarUrl) : ex.requesterAvatarUrl,
                };
            }
            return ex;
        });
      } catch (e) {
          console.error("Error enriching exchanges with user data", e);
      }
      return exchanges;
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'exchanges'); }
  }

  subscribeToExchanges(callback: (exchanges: any[]) => void): () => void {
    const uid = this._getCurrentUserId();
    const q = query(
      collection(db, 'exchanges'), 
      or(where('ownerId', '==', uid), where('requesterId', '==', uid))
    );
    
    return onSnapshot(q, async (snap) => {
      let exchanges = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      // Fetch latest user data for partners to keep avatars fresh
      const partnerIds = [...new Set(exchanges.map(ex => ex.ownerId === uid ? ex.requesterId : ex.ownerId))];
      const usersData: Record<string, any> = {};
      try {
        await Promise.all(partnerIds.map(async (pId) => {
           if (pId) {
               const uSnap = await getDoc(doc(db, 'users', pId));
               if (uSnap.exists()) {
                   usersData[pId] = uSnap.data();
               }
           }
        }));
        exchanges = exchanges.map(ex => {
            const partnerId = ex.ownerId === uid ? ex.requesterId : ex.ownerId;
            const u = usersData[partnerId];
            if (u) {
                return {
                    ...ex,
                    ownerAvatarUrl: ex.ownerId === partnerId ? (u.avatarUrl || ex.ownerAvatarUrl) : ex.ownerAvatarUrl,
                    requesterAvatarUrl: ex.requesterId === partnerId ? (u.avatarUrl || ex.requesterAvatarUrl) : ex.requesterAvatarUrl,
                };
            }
            return ex;
        });
      } catch (e) {
          console.error("Error enriching exchanges with user data", e);
      }

      callback(exchanges);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exchanges'));
  }

  async deleteExchanges(selectedIds): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const batch = writeBatch(db);
      for (const id of selectedIds) {
        const exSnap = await getDoc(doc(db, 'exchanges', id));
        if (exSnap.exists()) {
           const data = exSnap.data();
           if (data.ownerId === uid || data.requesterId === uid) {
             batch.delete(doc(db, 'exchanges', id));
           } else {
             throw new Error("No tienes permiso para borrar este intercambio");
           }
        }
      }
      await batch.commit();
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'exchanges'); }
  }

  async getChatAndExchangeDetails(exchangeId): Promise<any> {
    try {
      const exSnap = await getDoc(doc(db, 'exchanges', exchangeId));
      if (!exSnap.exists()) throw new Error("Intercambio no encontrado");
      
      const exchangeData = { id: exSnap.id, ...(exSnap.data() as any) };
      
      // Fetch owner, requester and items data
      const [ownerSnap, requesterSnap, requestedItemSnap] = await Promise.all([
        getDoc(doc(db, 'users', exchangeData.ownerId)),
        getDoc(doc(db, 'users', exchangeData.requesterId)),
        exchangeData.requestedItemId ? getDoc(doc(db, 'items', exchangeData.requestedItemId)) : Promise.resolve(null)
      ]);
      
      const owner = ownerSnap.exists() ? { id: ownerSnap.id, ...ownerSnap.data() } : null;
      const requester = requesterSnap.exists() ? { id: requesterSnap.id, ...requesterSnap.data() } : null;
      const requestedItem = requestedItemSnap && (requestedItemSnap as any).exists() ? { id: (requestedItemSnap as any).id, ...(requestedItemSnap as any).data() } : null;

      // Fetch offered items
      let offeredItems = [];
      if (exchangeData.offeredItemIds && exchangeData.offeredItemIds.length > 0) {
        const itemPromises = exchangeData.offeredItemIds.map(id => getDoc(doc(db, 'items', id)));
        const itemSnaps = await Promise.all(itemPromises);
        offeredItems = itemSnaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));
      }
      
      const chatSnap = await getDoc(doc(db, 'chats', exchangeId));
      
      return {
        exchange: { 
          ...exchangeData, 
          owner, 
          requester, 
          requestedItem,
          offeredItems: [...offeredItems, ...(exchangeData.otherItems || [])]
        },
        chat: chatSnap.exists() ? { id: chatSnap.id, ...(chatSnap.data() as any) } : { messages: [] }
      };
    } catch (e) { handleFirestoreError(e, OperationType.GET, 'chats'); }
  }

  subscribeToChat(exchangeId: string, callback: (chat: any) => void): () => void {
    const chatRef = doc(db, 'chats', exchangeId);
    return onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...(doc.data() as any) });
      } else {
        callback({ messages: [] });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });
  }

  subscribeToExchange(exchangeId: string, callback: (exchange: any) => void): () => void {
    const exRef = doc(db, 'exchanges', exchangeId);
    return onSnapshot(exRef, async (docSnap) => {
      if (docSnap.exists()) {
         const exchangeData = { id: docSnap.id, ...(docSnap.data() as any) };
         callback(exchangeData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exchanges');
    });
  }

  async sendMessage(exchangeId, text, image = null, partnerId = null): Promise<any> {
    const uid = this._getCurrentUserId();
    
    // Check moderation
    if (text) {
      const mod = await this._checkModeration(text);
      if (!mod.passed) {
        throw new Error(`El mensaje no cumple con las normas: ${mod.reason}`);
      }
    }
    
    try {
      let finalPartnerId = partnerId;
      if (!finalPartnerId) {
        const exSnap = await getDoc(doc(db, 'exchanges', exchangeId));
        if (!exSnap.exists()) throw new Error('Exchange not found');
        const exchangeData = exSnap.data() as any;
        finalPartnerId = exchangeData.ownerId === uid ? exchangeData.requesterId : exchangeData.ownerId;
      }
      
      let finalImage = image;
      if (image) {
        finalImage = await this._uploadImageIfBase64(image, `chats/${exchangeId}`);
      }
      const chatRef = doc(db, 'chats', exchangeId);
      
      const batch = writeBatch(db);
      
      batch.update(chatRef, { 
          messages: arrayUnion({ 
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
              senderId: uid, 
              text, 
              image: finalImage, 
              timestamp: new Date().toISOString() 
          }), 
          updatedAt: serverTimestamp() 
      });
      
      // Update exchange lastMessage
      batch.update(doc(db, 'exchanges', exchangeId), {
        lastMessage: text || 'Imagen',
        lastMessageAt: serverTimestamp(),
        unreadCount: increment(1)
      });
      
      // Create notification for new message
      if (finalPartnerId) {
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            userId: finalPartnerId,
            type: 'NEW_MESSAGE',
            title: 'Nuevo mensaje',
            message: text ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : 'Has recibido una imagen.',
            data: { exchangeId: exchangeId },
            read: false,
            createdAt: serverTimestamp()
          });
      }

      await batch.commit();
      
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'chats'); }
  }

  async openDirectAdminChat(userId): Promise<any> { return 'admin-chat-' + userId; }
  async rateUserAndCompleteExchange(exchangeId, ratingData): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const exSnap = await getDoc(doc(db, 'exchanges', exchangeId));
      if (!exSnap.exists()) throw new Error('Exchange not found');
      const exchange = exSnap.data() as any;
      
      if (exchange.status !== 'ACCEPTED' && exchange.status !== 'MEETING_ACCEPTED' && exchange.status !== 'COMPLETED') {
        throw new Error('El intercambio no está en un estado válido para valorar');
      }
      
      if (exchange.ratedBy && exchange.ratedBy.includes(uid)) {
        throw new Error('Ya has valorado este intercambio');
      }
      
      if (exchange.ownerId === exchange.requesterId) {
        throw new Error('No puedes valorarte a ti mismo');
      }
      
      const targetUserId = exchange.ownerId === uid ? exchange.requesterId : exchange.ownerId;
      
      const batch = writeBatch(db);
      
      // Update exchange status and ratedBy
      batch.update(doc(db, 'exchanges', exchangeId), { 
        status: 'COMPLETED',
        ratedBy: arrayUnion(uid),
        updatedAt: serverTimestamp()
      });
      
      // Mark items as EXCHANGED
      if (exchange.requestedItemId) {
        batch.update(doc(db, 'items', exchange.requestedItemId), { status: 'EXCHANGED', exchangeId: exchangeId, updatedAt: serverTimestamp() });
      }
      if (exchange.offeredItemId) {
        batch.update(doc(db, 'items', exchange.offeredItemId), { status: 'EXCHANGED', exchangeId: exchangeId, updatedAt: serverTimestamp() });
      }
      if (exchange.offeredItemIds && Array.isArray(exchange.offeredItemIds)) {
        for (const itemId of exchange.offeredItemIds) {
          batch.update(doc(db, 'items', itemId), { status: 'EXCHANGED', exchangeId: exchangeId, updatedAt: serverTimestamp() });
        }
      }
      
      // Add rating to target user via new collection
      const ratingRef = doc(collection(db, 'ratings'), `${exchangeId}_${targetUserId}`);
      batch.set(ratingRef, {
        exchangeId,
        fromUserId: uid,
        toUserId: targetUserId,
        rating: ratingData.rating,
        comment: ratingData.comment,
        createdAt: serverTimestamp()
      });
      
      await batch.commit();
      logAppEvent('exchange_completed', { exchangeId });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'exchanges'); }
  }
  async acceptMeetingLocation(id, address, type): Promise<any> {
    try {
      await updateDoc(doc(db, 'exchanges', id), {
        meetingLocation: address,
        meetingType: type,
        status: 'MEETING_ACCEPTED',
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'exchanges'); }
  }
  async getSmartMeetingSuggestions(lat: number, lng: number): Promise<any> {
    return [
      { name: "Cafetería Central", lat: lat + 0.001, lng: lng + 0.001, type: "Establecimiento público y seguro" },
      { name: "Estación Cercanías", lat: lat - 0.002, lng: lng + 0.0015, type: "Muy transitado y vigilado" },
      { name: "Centro Comercial", lat: lat + 0.0015, lng: lng - 0.002, type: "Mucha afluencia, cámaras de seguridad" }
    ];
  }

  // Moderation
  async reportContent(id: string, type: string, reason: string, details: string = '', isAuto = false): Promise<any> {
    const uid = this._getCurrentUserId();
    if (uid === id) {
      throw new Error('No puedes reportar tu propio contenido');
    }
    
    // Comprobar si ya ha sido reportado
    // Los artículos solo se pueden reportar una vez por usuario. 
    // Los usuarios pueden ser reportados múltiples veces (por motivos distintos).
    
    if (type === 'ITEM') {
        const existingSnap = await getDocs(query(
          collection(db, 'reports'),
          where('reporterId', '==', uid),
          where('targetId', '==', id),
          where('targetType', '==', 'ITEM')
        ));
        
        if (!existingSnap.empty) {
          throw new Error('Ya has reportado este artículo anteriormente.');
        }
    } else if (type === 'USER') {
         const existingSnap = await getDocs(query(
          collection(db, 'reports'),
          where('reporterId', '==', uid),
          where('targetId', '==', id),
          where('targetType', '==', 'USER'),
          where('reason', '==', reason)
        ));
        
        if (!existingSnap.empty) {
          throw new Error('Ya has reportado a este usuario por este mismo motivo.');
        }   
    }
    
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: uid, 
        targetId: id, 
        targetType: type, 
        reason,
        details,
        isAuto,
        status: 'PENDING', 
        createdAt: new Date().toISOString()
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'reports'); }
  }

  async getModerationQueue(): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, 'reports'), where('status', '==', 'PENDING')));
      const reports = [];
      for (const d of snap.docs) {
        const data = d.data();
        let reporterName = 'Desconocido';
        let preview = 'Contenido eliminado o inaccesible';
        let targetOwnerId = null;
        let targetOwnerName = 'Desconocido';
        let targetImage = null;
        
        try {
          if (data.reporterId) {
             const userDoc = await getDoc(doc(db, 'users', data.reporterId));
             if (userDoc.exists()) reporterName = userDoc.data().name || userDoc.data().email || 'Usuario';
          }
          
          if (data.targetType === 'ITEM') {
             const itemDoc = await getDoc(doc(db, 'items', data.targetId));
             if (itemDoc.exists()) {
                const itemData = itemDoc.data();
                preview = itemData.title;
                targetImage = itemData.images?.[0] || null;
                targetOwnerId = itemData.userId;
                
                if (targetOwnerId) {
                   const ownerDoc = await getDoc(doc(db, 'users', targetOwnerId));
                   if (ownerDoc.exists()) {
                      targetOwnerName = ownerDoc.data().name || ownerDoc.data().email;
                   }
                }
             }
          }
        } catch(e) {
          console.error("Error fetching report details", e);
        }
        
        reports.push({ 
            id: d.id, 
            date: data.createdAt,
            type: data.targetType,
            reason: data.reason,
            details: data.details || '',
            targetId: data.targetId,
            preview,
            reporterName,
            reporterId: data.reporterId,
            targetOwnerId,
            targetOwnerName,
            targetImage,
            isAuto: data.isAuto || false,
            ...data
        });
      }
      return reports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'reports'); }
  }

  async resolveModeration(alertId, type, action): Promise<any> {
    try { await updateDoc(doc(db, 'reports', alertId), { status: 'RESOLVED' }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'reports'); }
  }

  async getAdminStats(): Promise<any> {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const itemsSnap = await getDocs(collection(db, 'items'));
      const exchangesSnap = await getDocs(collection(db, 'exchanges'));
      const alertsSnap = await getDocs(query(collection(db, 'reports'), where('status', '==', 'PENDING')));
      return {
        totalUsers: usersSnap.size,
        totalItems: itemsSnap.size,
        totalExchanges: exchangesSnap.size,
        pendingAlerts: alertsSnap.size
      };
    } catch (e) {
      return { totalUsers: 0, totalItems: 0, totalExchanges: 0, pendingAlerts: 0 };
    }
  }
  async getModerationLogs(): Promise<any> {
    return [];
  }
  async addFilterCategory(cat: string): Promise<any> {
    if (!INITIAL_MODERATION_RULES[cat]) {
      INITIAL_MODERATION_RULES[cat] = [];
    }
  }
  async addFilterWord(cat: string, word: string): Promise<any> {
    if (INITIAL_MODERATION_RULES[cat] && !INITIAL_MODERATION_RULES[cat].includes(word)) {
      INITIAL_MODERATION_RULES[cat].push(word);
    }
  }
  async removeFilterWord(cat: string, word: string): Promise<any> {
    if (INITIAL_MODERATION_RULES[cat]) {
      INITIAL_MODERATION_RULES[cat] = INITIAL_MODERATION_RULES[cat].filter(w => w !== word);
    }
  }
  _getFilters(): any { return INITIAL_MODERATION_RULES; }

  // Notifications & Drafts
  subscribeToNotifications(uid: string, callback: (notifs: any[]) => void): () => void {
    if (this._isSeeding) return () => {};
    const q = query(collection(db, 'notifications'), where('userId', '==', uid));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }, (error) => {
      if (this._isSeeding) return;
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
  }

  async getNotificationsForUser(uid): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'notifications'); }
  }

  async markAllNotificationsRead(uid): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid), where('read', '==', false)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'notifications'); }
  }
}

export const api = new ApiClient();
export const viewHistoryService = { 
    getHistory: () => {
        try {
            const data = localStorage.getItem('swapit_view_history');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }, 
    addItem: (item) => {
        try {
            let history = viewHistoryService.getHistory();
            history = history.filter(h => h.id !== item.id);
            history.unshift({ id: item.id, title: item.title, imageUrl: item.imageUrls?.[0], timestamp: Date.now() });
            localStorage.setItem('swapit_view_history', JSON.stringify(history.slice(0, 20)));
        } catch (e) {}
    } 
};
