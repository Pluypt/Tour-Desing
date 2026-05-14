import * as admin from 'firebase-admin';
import path from 'path';

// Load the service account key JSON file
// We use path.resolve to ensure it finds the file relative to the project root
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-admin-key.json');

// Initialize Firebase Admin only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
      // If you need Realtime Database or Storage, uncomment and fill these out:
      // databaseURL: "https://tourdesing-e0529-default-rtdb.firebaseio.com",
      // storageBucket: "tourdesing-e0529.firebasestorage.app"
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

// Export the admin instance, or specific services
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminDb, adminAuth };
