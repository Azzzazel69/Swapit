import { ExchangeStatus, ItemCondition } from '../types';
import { CATEGORIES_WITH_SUBCATEGORIES, USER_CATEGORIES } from '../constants';
import { db, auth, googleProvider, storage } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { sendEmailVerification, applyActionCode } from 'firebase/auth';
import { logAppEvent } from './analytics';

export const DEFAULT_AVATAR_NEUTRAL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0UwRTAxMCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

const INITIAL_MODERATION_RULES = {
    HARASSMENT: ['puta', 'maricon', 'imbecil', 'subnormal', 'gilipollas', 'estupido', 'mierda', 'basura', 'rata', 'escoria'],
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
      providerInfo: auth.currentUser?.providerData.map(provider => ({
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
  setToken(token: string | null) { this.token = token; }

  _getCurrentUserId() {
    return auth.currentUser?.uid;
  }

  async getCurrentUser(): Promise<any> {
    const uid = this._getCurrentUserId();
    if (!uid) return null;
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) return { id: snap.id, ...(snap.data() as any) };
      return null;
    } catch (e) { handleFirestoreError(e, OperationType.GET, 'users'); }
  }

  async login(email, password): Promise<any> {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { token: await cred.user.getIdToken() };
    } catch (e: any) {
      let message = 'Credenciales inválidas';
      if (e.code === 'auth/user-not-found') message = 'No existe ninguna cuenta con este correo';
      if (e.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
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
    try {
      const imageRef = ref(storage, `${path}/${Date.now()}_${Math.random().toString(36).substring(7)}`);
      
      // Add timeout to prevent hanging if storage is not configured
      let isTimeout = false;
      const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => {
        isTimeout = true;
        reject(new Error('Upload timeout'));
      }, 30000));
      
      const uploadAndGetUrl = async () => {
        await uploadString(imageRef, imageStr, 'data_url');
        return await getDownloadURL(imageRef);
      };
      
      const uploadPromise = uploadAndGetUrl();
      
      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch (e) {
      console.error('Image upload failed or timed out:', e.message);
      throw new Error('No se pudo subir la imagen. Por favor, inténtalo de nuevo.');
    }
  }

  async register(name, email, password, avatarUrl, location): Promise<any> {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email immediately
      try {
        await sendEmailVerification(cred.user);
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

  async getUserProfile(uid): Promise<any> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        const items = await this.getUserItems(uid);
        const updatedItems = items.map(item => ({
          ...item,
          ownerName: item.ownerName && item.ownerName !== 'Usuario' ? item.ownerName : (data.name || 'Usuario'),
          ownerAvatarUrl: item.ownerAvatarUrl || data.avatarUrl || DEFAULT_AVATAR_NEUTRAL,
          ownerLocation: item.ownerLocation || data.location || null
        }));
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
      return await this.getCurrentUser();
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }

  async completeRegistration(userData: { name: string, email: string, avatarUrl?: string, location?: any, preferences?: string[] }): Promise<any> {
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
        emailVerified: auth.currentUser?.emailVerified || false,
        phoneVerified: false, 
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
        await sendEmailVerification(auth.currentUser);
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

  async sendPhoneVerificationCode(phone): Promise<any> { return { success: true }; }
  async verifyPhoneCode(code): Promise<any> { return true; }
  async canEditProfile(): Promise<any> { return { canEdit: true, reason: null }; }
  async updateUserPassword(currentPassword, newPassword): Promise<any> { return { success: true }; }
  async toggleFollowUser(uid): Promise<any> { return { success: true, isFollowing: false }; }
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
        createdAt: new Date().toISOString()
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
      
      // In a real app, we would scrape the profile here.
      // For this demo, we'll simulate a successful check after a short delay.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await updateDoc(docRef, { status: 'VERIFIED', verifiedAt: new Date().toISOString() });
      await updateDoc(doc(db, 'users', uid), { identityVerified: true, identityVerificationStatus: 'VERIFIED' });
      
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'trust_verifications');
    }
  }
  async assignRole(uid, role): Promise<any> {
    try { await updateDoc(doc(db, 'users', uid), { role }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }
  async banUser(uid, reason): Promise<any> {
    try { await updateDoc(doc(db, 'users', uid), { status: 'BANNED', banReason: reason }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }
  async unbanUser(uid): Promise<any> {
    try { await updateDoc(doc(db, 'users', uid), { status: 'ACTIVE' }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  }
  async getAllUsersAdmin(): Promise<any> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'users'); }
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
    try { await deleteDoc(doc(db, 'items', itemId)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'items'); }
  }

  async getItemById(id): Promise<any> {
    try {
      const snap = await getDoc(doc(db, 'items', id));
      if (snap.exists()) {
        const item = { id: snap.id, ...(snap.data() as any) };
        if (!item.ownerName || item.ownerName === 'Usuario') {
          try {
            const uSnap = await getDoc(doc(db, 'users', item.userId));
            if (uSnap.exists()) {
              const u = uSnap.data();
              item.ownerName = u.name || 'Usuario';
              item.ownerAvatarUrl = u.avatarUrl || DEFAULT_AVATAR_NEUTRAL;
              item.ownerLocation = u.location || null;
            }
          } catch (e) { console.error("Error fetching user for item", e); }
        }
        return item;
      }
      throw new Error('Item no encontrado');
    } catch (e) { handleFirestoreError(e, OperationType.GET, 'items'); }
  }

  async getUserItems(uid): Promise<any> {
    try {
      const q = query(collection(db, 'items'), where('userId', '==', uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'items'); }
  }

  async getHomePageData(params: any = {}): Promise<any> {
    const userId = this._getCurrentUserId();
    try {
      // 1. Get all available items
      let allItems = [];
      try {
        const q = query(collection(db, 'items'), where('status', '==', 'AVAILABLE'), orderBy('createdAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        allItems = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        // Fetch missing user data for items that don't have denormalized owner info
        const itemsMissingOwner = allItems.filter(i => !i.ownerName || i.ownerName === 'Usuario');
        if (itemsMissingOwner.length > 0) {
          const uniqueUserIds = [...new Set(itemsMissingOwner.map(i => i.userId))];
          const usersData: Record<string, any> = {};
          
          await Promise.all(uniqueUserIds.map(async (uid) => {
            try {
              const uSnap = await getDoc(doc(db, 'users', uid));
              if (uSnap.exists()) {
                usersData[uid] = uSnap.data();
              }
            } catch (e) {
              console.error("Error fetching user", uid, e);
            }
          }));
          
          allItems = allItems.map(item => {
            const u = usersData[item.userId];
            if (u) {
              return {
                ...item,
                ownerName: item.ownerName && item.ownerName !== 'Usuario' ? item.ownerName : (u.name || 'Usuario'),
                ownerAvatarUrl: item.ownerAvatarUrl || u.avatarUrl || DEFAULT_AVATAR_NEUTRAL,
                ownerLocation: item.ownerLocation || u.location || null
              };
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
      
      // 3. Get swiped items
      let swipedItemIds = new Set<string>();
      try {
        const swipedSnap = await getDocs(query(collection(db, 'swipes'), where('userId', '==', userId)));
        swipedItemIds = new Set(swipedSnap.docs.map(d => d.data().itemId));
      } catch (e) {
        console.error("Error fetching swiped items:", e);
      }

      // 4. Filter out own items and swiped items
      const otherItems = allItems.filter(i => i.userId !== userId);
      const unswipedItems = otherItems.filter(i => !swipedItemIds.has(i.id));

      // 5. Categorize
      
      // Direct Matches: Owner of item wants what I have AND I haven't swiped it yet
      const directMatches = unswipedItems.filter(item => {
        if (!item.wishedItem) return false;
        const searchTerms = item.wishedItem.toLowerCase().split(/[\s,]+/).filter(t => t.length > 2);
        return userItems.some(ui => {
          const title = ui.title.toLowerCase();
          const cat = ui.category.toLowerCase();
          return searchTerms.some(term => title.includes(term) || cat.includes(term));
        });
      });

      // Recommended: Items in user's preferred categories
      const recommended = unswipedItems.filter(item => 
        userPreferences.some(pref => item.category.toLowerCase().includes(pref.toLowerCase())) && 
        !directMatches.some(dm => dm.id === item.id)
      );

      // Near Items: Items in the same city
      const nearItems = otherItems.filter(item => 
        userCity && item.ownerLocation?.city?.toLowerCase() === userCity.toLowerCase()
      );

      // Popular Items: Based on viewCount or favoriteCount
      const popularItems = [...otherItems].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10);

      // Favorite Items: Items the user has favorited
      const userFavorites = userData.favorites || [];
      const favoriteItems = allItems.filter(item => userFavorites.includes(item.id));

      return { 
        exploreItems: unswipedItems.length > 0 ? unswipedItems : otherItems, 
        directMatches: directMatches, 
        recommended: recommended, 
        nearItems: nearItems, 
        favoriteItems: favoriteItems, 
        popularItems: popularItems, 
        totalExploreItems: unswipedItems.length 
      };
    } catch (e) { 
      console.error("Critical error in getHomePageData:", e);
      handleFirestoreError(e, OperationType.LIST, 'home_page_data'); 
    }
  }

  async toggleFavorite(itemId): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const userRef = doc(db, 'users', uid as string);
      const snap = await getDoc(userRef);
      const favs = snap.data()?.favorites || [];
      if (favs.includes(itemId)) {
        await updateDoc(userRef, { favorites: arrayRemove(itemId) });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(itemId) });
      }
      return await this.getItemById(itemId);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
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

      // Fetch user data for items missing ownerName
      const itemsMissingOwner = filteredItems.filter(i => !i.ownerName || i.ownerName === 'Usuario');
      if (itemsMissingOwner.length > 0) {
          const uniqueUserIds = [...new Set(itemsMissingOwner.map(i => i.userId))];
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
                ownerName: item.ownerName && item.ownerName !== 'Usuario' ? item.ownerName : (u.name || 'Usuario'),
                ownerAvatarUrl: item.ownerAvatarUrl || u.avatarUrl || DEFAULT_AVATAR_NEUTRAL,
                ownerLocation: item.ownerLocation || u.location || null
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
    try {
      // Record the swipe
      await addDoc(collection(db, 'swipes'), {
        userId: uid,
        itemId: itemId,
        type: type, // 'like' or 'dislike'
        timestamp: new Date().toISOString()
      });

      if (type === 'like') {
        logAppEvent('swipe_like', { itemId });
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
              logAppEvent('match_created', { itemId });
              return { match: true, isMatch: true, matchedItemId: matchSnap.docs[0].data().itemId };
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
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
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
                
                // Compress to JPEG with 0.7 quality to ensure small size
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  }

  // Exchanges & Chats
  async createExchangeProposal(data): Promise<any> {
    const uid = this._getCurrentUserId();
    const user = await this.getCurrentUser();
    try {
      const itemSnap = await getDoc(doc(db, 'items', data.requestedItemId));
      const ownerId = itemSnap.data()?.userId;
      const ownerSnap = await getDoc(doc(db, 'users', ownerId));
      
      const docRef = await addDoc(collection(db, 'exchanges'), {
        ...data,
        ownerId,
        requesterId: uid,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        ownerName: ownerSnap.data()?.name,
        requesterName: (user as any).name
      });
      
      // Create chat
      await setDoc(doc(db, 'chats', docRef.id), {
        exchangeId: docRef.id,
        messages: [{ id: 'm1', senderId: uid, text: data.message || 'Hola, me interesa este intercambio.', timestamp: new Date().toISOString() }]
      });
      
      return { id: docRef.id };
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'exchanges'); }
  }

  async updateExchangeStatus(exchangeId, status): Promise<any> {
    try {
      await updateDoc(doc(db, 'exchanges', exchangeId), { status });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'exchanges'); }
  }

  async getExchanges(): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const q1 = query(collection(db, 'exchanges'), where('ownerId', '==', uid));
      const q2 = query(collection(db, 'exchanges'), where('requesterId', '==', uid));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const exchanges = [...s1.docs, ...s2.docs].map(d => ({ id: d.id, ...(d.data() as any) }));
      // Deduplicate
      const unique = Array.from(new Map(exchanges.map(item => [item.id, item])).values());
      return unique;
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'exchanges'); }
  }

  subscribeToExchanges(callback: (exchanges: any[]) => void): () => void {
    const uid = this._getCurrentUserId();
    const q1 = query(collection(db, 'exchanges'), where('ownerId', '==', uid));
    const q2 = query(collection(db, 'exchanges'), where('requesterId', '==', uid));
    
    let exchanges1: any[] = [];
    let exchanges2: any[] = [];

    const updateExchanges = () => {
      const all = [...exchanges1, ...exchanges2];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      callback(unique);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      exchanges1 = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      updateExchanges();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exchanges'));

    const unsub2 = onSnapshot(q2, (snap) => {
      exchanges2 = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      updateExchanges();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exchanges'));

    return () => {
      unsub1();
      unsub2();
    };
  }

  async deleteExchanges(selectedIds): Promise<any> {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'exchanges', id)));
      await batch.commit();
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'exchanges'); }
  }

  async getChatAndExchangeDetails(exchangeId): Promise<any> {
    try {
      const exSnap = await getDoc(doc(db, 'exchanges', exchangeId));
      const chatSnap = await getDoc(doc(db, 'chats', exchangeId));
      return {
        exchange: { id: exSnap.id, ...(exSnap.data() as any) },
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
    return onSnapshot(exRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...(doc.data() as any) });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exchanges');
    });
  }

  async sendMessage(exchangeId, text, image = null): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      let finalImage = image;
      if (image) {
        finalImage = await this._uploadImageIfBase64(image, `chats/${exchangeId}`);
      }
      const chatRef = doc(db, 'chats', exchangeId);
      const chatSnap = await getDoc(chatRef);
      const messages = chatSnap.exists() ? chatSnap.data().messages : [];
      messages.push({ id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, senderId: uid, text, image: finalImage, timestamp: new Date().toISOString() });
      await setDoc(chatRef, { exchangeId, messages });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'chats'); }
  }

  async openDirectAdminChat(userId): Promise<any> { return 'admin-chat-' + userId; }
  async rateUserAndCompleteExchange(exchangeId, ratingData): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      const exSnap = await getDoc(doc(db, 'exchanges', exchangeId));
      if (!exSnap.exists()) throw new Error('Exchange not found');
      const exchange = exSnap.data() as any;
      
      const targetUserId = exchange.ownerId === uid ? exchange.requesterId : exchange.ownerId;
      
      const batch = writeBatch(db);
      
      // Update exchange status
      batch.update(doc(db, 'exchanges', exchangeId), { status: 'COMPLETED' });
      
      // Mark items as EXCHANGED
      if (exchange.requestedItemId) {
        batch.update(doc(db, 'items', exchange.requestedItemId), { status: 'EXCHANGED' });
      }
      if (exchange.offeredItemId) {
        batch.update(doc(db, 'items', exchange.offeredItemId), { status: 'EXCHANGED' });
      }
      
      // Add rating to target user
      const targetUserRef = doc(db, 'users', targetUserId);
      batch.update(targetUserRef, {
        ratings: arrayUnion({
          rating: ratingData.rating,
          comment: ratingData.comment,
          fromUserId: uid,
          timestamp: new Date().toISOString()
        })
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
        status: 'MEETING_ACCEPTED'
      });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'exchanges'); }
  }
  async getSmartMeetingSuggestions(lat, lng): Promise<any> { return []; }

  // Moderation
  async reportContent(id, type, reason, isAuto = false): Promise<any> {
    const uid = this._getCurrentUserId();
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: uid, targetId: id, targetType: type, reason, status: 'PENDING', createdAt: new Date().toISOString()
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'reports'); }
  }

  async getModerationQueue(): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, 'reports'), where('status', '==', 'PENDING')));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'reports'); }
  }

  async resolveModeration(alertId, type, action): Promise<any> {
    try { await updateDoc(doc(db, 'reports', alertId), { status: 'RESOLVED' }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'reports'); }
  }

  async getAdminStats(): Promise<any> { return { totalUsers: 0, activeItems: 0, pendingReports: 0, completedExchanges: 0 }; }
  async getModerationLogs(): Promise<any> { return []; }
  async addFilterCategory(cat): Promise<any> {}
  async addFilterWord(cat, word): Promise<any> {}
  async removeFilterWord(cat, word): Promise<any> {}
  _getFilters(): any { return INITIAL_MODERATION_RULES; }

  // Notifications & Drafts
  subscribeToNotifications(uid: string, callback: (notifs: any[]) => void): () => void {
    const q = query(collection(db, 'notifications'), where('userId', '==', uid));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
  }

  async getNotificationsForUserDev(uid): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, 'notifications'); }
  }

  async markAllNotificationsReadDev(uid): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid), where('read', '==', false)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'notifications'); }
  }

  async saveDraft(draftData): Promise<any> {
    if (typeof window !== 'undefined') window.localStorage.setItem('draft', JSON.stringify(draftData));
  }
  async getDraft(): Promise<any> {
    if (typeof window !== 'undefined') {
      const d = window.localStorage.getItem('draft');
      return d ? JSON.parse(d) : null;
    }
    return null;
  }
  async clearDraft(): Promise<any> {
    if (typeof window !== 'undefined') window.localStorage.removeItem('draft');
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
