import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let app: admin.app.App;

// Direct service account object for production deployment (Vercel)
const pKey = [
  "-----BEGIN PRIVATE KEY-----\n",
  "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDBOKoVS6BN9+W+\n",
  "3dVp5NIArdMm2FLq/UjUfHno84wQPqvgSFdxBpQVIrv9w4GrU/NNawjI3pGHosyp\n",
  "4kqjbULUmNeKH468nDNhvXWkI0Lo9c+ZXNeJDLOyBwSC+UMe6zNrn8KeJHmYRYR7\n",
  "A7KLSNM05m5AeOJeEI/Gx/tRhTweMATydTt2cJcbWK7zG0MohrkNWNS67CsIEhTF\n",
  "BvTDDtfbkEvkGiJzgH7CW0Ve3T0uerUQEc/kDxiA8UHYieGLmQGrRrrughBIK64i\n",
  "s7dmiDNk8UDd/svY1Ppe4lnbfjwcU1JkLOH7sGWJlj8xoVCGRXcEF4hrafHaCycY\n",
  "pEN+34FzAgMBAAECggEAFbv10csTH0ISazumZ7DFTdiU/EpwBUker0bIgG4eJAOm\n",
  "BLv5GK3IlsS0nbunSH97H4sPJBJ5DzyTm0u+No+HPsUUgE/Cwq9/+MS9c2GYrf4H\n",
  "Gd//dJs4/qkFwQ/LFN1tssj333Rd4xrKvKWdU0ff+L7aHvwaBm0EJzQpLlx3dzOg\n",
  "eTAHaU8Gtq4HsIeFjvgqSNkRgInGkvm5jVhvdQqGizJyw2OprOSmjG3xQeCXnFSZ\n",
  "hNVyd7QCwD3WrB3wWEgkAml+wiv+n585WrOFTCiTljU1zLpRstdZt5wUvMBEnpkM\n",
  "FMAcKK/SWAj0+DWTqz04/ojTMgpCQXilcCOVdReHHQKBgQDqD0eIUF7cnjDbIJT/\n",
  "JOnNXsNibWWkObVjWvGs13Bx8X5YHgaTEBFkvrrCMnU1YUMNU+wd0qyYa6APrOO+\n",
  "5kAjGQ0dUw2DIsINBcwsKpKz0Nq8UIezv5q3GOlht+Utf9vD+l67lVt/reHocwYG\n",
  "m7r70vlTsVCFMMprZ5HOcNrU9wKBgQDTVWOWJtXdUYfAy7phuSI15f7V/PYYEjDB\n",
  "xKyUrc+8chtUcPye7rextaMDFBRnLPUlqBOL0SKcRcxl4tE4lGsYvhQ7bclcenJI\n",
  "bdnj+OZxCo3H5VBkyXzHpzbqZKEeQSWtCatMjdzqcndRZYrZjuyEtDBcLmaflfQ3\n",
  "Q0bfvC9kZQKBgGtgyx5cUMjBwgQldHWBB8nx+Y0ERycKWo7UQB9dTvbXJXFjhPye\n",
  "2HvxjFhfMapljo9kuuQLrKbYaTwHwwvnMfFoIr4bRg2tOn0i9cIlXdwkqtTN1RO/\n",
  "iUkKorbz2K4BBF9qU1+Xa7ytlwA/FLqfYy74YO3mYNxZv+N6RkgBOkONAoGBAJBQ\n",
  "AhZZ5LciYrJ8LIVpF/x4V4InIKIlYdggBr3sxyvnO9R453lciGI5J90FTD18jNcv\n",
  "JFHY+Wp/m2mD7t1VNKELw+MlQFj/YKUnJqCvqiVNUK5NYI3CrYvlGvIKz59KW4ED\n",
  "Vk+LnG0Yx3P1BFE2cTrZlSCNqxSVINTQA0jrR+2lAoGABPSZ1C2oZ/IkZrLz3lKn\n",
  "rrhngHTXGayc7Vh5LgMwD4sVfwj4f4xpQ4WJVvoDjDKvknOi5zAb65J4xv1tlQ80\n",
  "lVeAyOlxI+ojgJ2wFdY0MtYcv0sNJKQ0QDMadTwtCL9uyGWefOp27lJauRYRLRye\n",
  "UdLD7gAbjuUUCtT6IA7+VCY=\n",
  "-----END PRIVATE KEY-----\n"
].join("");

const fallbackServiceAccount = {
  type: "service_account",
  project_id: "tour-desing",
  private_key_id: "41f65c8ae695745cb396b4a575458efc064f3116",
  private_key: pKey,
  client_email: "firebase-adminsdk-fbsvc@tour-desing.iam.gserviceaccount.com",
  client_id: "109198703317762354498",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tour-desing.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-admin-key.json');
    let serviceAccount: any = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env:', e);
      }
    }

    if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      } catch (e) {
        console.error('Failed to parse firebase-admin-key.json file:', e);
      }
    }

    if (!serviceAccount) {
      serviceAccount = fallbackServiceAccount;
    }

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount?.project_id || "tour-desing"
    });
    console.log('Firebase Admin initialized successfully.');
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
