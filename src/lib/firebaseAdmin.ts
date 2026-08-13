import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let app: admin.app.App;

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-admin-key.json');
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "tour-desing"
      });
      console.log('Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_KEY env.');
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "tour-desing"
      });
      console.log('Firebase Admin initialized with key file.');
    } else {
      app = admin.initializeApp({
        projectId: "tour-desing"
      });
      console.warn('Firebase Admin initialized without service account key. Place firebase-admin-key.json in project root for full admin permissions.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    app = admin.app();
  }
} else {
  app = admin.app();
}

const adminDb = getFirestore(app, 'tourdesing-database');
const adminAuth = admin.auth();

export { admin, adminDb, adminAuth };

