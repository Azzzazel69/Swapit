import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', 'pedro_troll_v5@test.com')));
  if (usersSnapshot.empty) {
    console.log("pedro troll not found");
    return;
  }
  const pedroId = usersSnapshot.docs[0].id;
  const pedroData = usersSnapshot.docs[0].data();
  console.log("Pedro ID:", pedroId);
  console.log("Pedro Avatar prefix:", pedroData.avatarUrl?.substring(0, 50));
  console.log("Pedro Avatar length:", pedroData.avatarUrl?.length);

  const itemsSnapshot = await getDocs(query(collection(db, 'items'), where('userId', '==', pedroId)));
  console.log("Items count:", itemsSnapshot.size);
  itemsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`-- Item ${doc.id} ownerAvatarUrl prefix:`, data.ownerAvatarUrl?.substring(0, 50));
    console.log(`-- Item ${doc.id} ownerAvatarUrl length:`, data.ownerAvatarUrl?.length);
  });
  
  process.exit(0);
}
test().catch(console.error);
