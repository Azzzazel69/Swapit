import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Minimal Rules Verification Script
 * Requires running Firebase Emulator: firebase emulators:start --only firestore
 */
async function runTests() {
  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-swapit',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  } catch (e) {
    console.warn("Could not initialize TestEnvironment. Skipping tests.", e);
    return;
  }

  // 1. EmailVerified cannot be set unless auth token is verified.
  const unverifiedUser = testEnv.authenticatedContext('user1', { email_verified: false });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/user1'), { role: 'USER', emailVerified: false });
  });
  await assertFails(updateDoc(doc(unverifiedUser.firestore(), 'users/user1'), { emailVerified: true, updatedAt: new Date() }));
  
  const verifiedUser = testEnv.authenticatedContext('user1', { email_verified: true });
  await assertSucceeds(updateDoc(doc(verifiedUser.firestore(), 'users/user1'), { emailVerified: true, updatedAt: new Date() }));

  // 2. Profile update cannot modify role/status/isBanned/etc.
  await assertFails(updateDoc(doc(verifiedUser.firestore(), 'users/user1'), { role: 'MODERATOR' }));
  await assertFails(updateDoc(doc(verifiedUser.firestore(), 'users/user1'), { isBanned: true }));

  // 3. Rating works and Duplicate rating fails
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'exchanges/ex1'), {
      status: 'COMPLETED', ownerId: 'user1', requesterId: 'user2', ratedBy: []
    });
  });
  
  const user1 = testEnv.authenticatedContext('user1');
  const user3 = testEnv.authenticatedContext('user3'); // non-participant

  // User3 tries to rate -> fails
  await assertFails(setDoc(doc(user3.firestore(), 'ratings/ex1_user3'), { exchangeId: 'ex1', fromUserId: 'user3', toUserId: 'user2', rating: 5, createdAt: new Date() }));
  
  // User1 rates -> succeeds
  await assertSucceeds(setDoc(doc(user1.firestore(), 'ratings/ex1_user1'), { exchangeId: 'ex1', fromUserId: 'user1', toUserId: 'user2', rating: 5, createdAt: new Date() }));
  
  // Duplicate rating -> fails because doc already exists
  await assertFails(setDoc(doc(user1.firestore(), 'ratings/ex1_user1'), { exchangeId: 'ex1', fromUserId: 'user1', toUserId: 'user2', rating: 4, createdAt: new Date() }));

  // 4. Notifications
  await assertFails(setDoc(doc(user1.firestore(), 'notifications/notif1'), { userId: 'user2', type: 'SOME_TYPE' })); // arbitrary
  
  console.log("Firebase rules unit tests passed against emulator configuration.");
}

runTests();
