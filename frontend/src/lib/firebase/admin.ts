import admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  // Remove surrounding quotes if present and replace escaped newlines
  const formattedPrivateKey = privateKey
    ? privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: formattedPrivateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const storage = admin.storage();
export const firestore = admin.firestore();