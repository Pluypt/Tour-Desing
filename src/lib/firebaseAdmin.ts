import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let app: admin.app.App;

// Encoded service account fallback for cloud deployment (Vercel)
const embeddedB64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAidG91ci1kZXNpbmciLAogICJwcml2YXRlX2tleV9pZCI6ICI0MWY2NWM4YWU2OTU3NDVjYjM5NmI0YTU3NTQ1OGVmYzA2NGYzMTE2IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdlFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLY3dnZ1NqQWdFQUFvSUJBUURCT0tvVlM2Qk45K1crXG4zZFZwNU5JQXJkTW0yRkxxL1VqVWZIbm84NHdRUHF2Z1NGZHhCcFFWSXJ2OXc0R3JVL05OYXdqSTNwR0hvc3lwXG40a3FqYlVMVW1OZUtINDY4bkROaHZYV2tJMExvOWMrWlhOZUpETE95QndTQytVTWU2ek5ybjhLZUpIbVlSWVI3XG5BN0tMU05NMDVtNUFlT0plRUkvR3gvdFJoVHdlTUFUeWRUdDJjSmNiV0s3ekcwTW9ocmtOV05TNjdDc0lFaFRGXG5BdlRERHRmYmtFdmtHaUp6Z0g3Q1cwVmUzVDB1ZXJVUUVjL2tEeGlBOFVIWWllR0xtUUdyUnJydWdoQklLNjRpXG5zN2RtaUROazhVRGQvc3ZZMVBwZTRsbmJmandjVTFKa0xPSDdzR1dKbGo4eG9WQ0dSWGNFRjRocmFmSGFDeWNZXG5wRU4rMzRGekFnTUJBQUVDZ2dFQUZidjEwY3NUSDBJU2F6dW1aN0RGVGRpVS9FcHdCVWtlcjBiSWdHNGVKQU9tXG5CTHY1R0szSWxzUzBuYnVuU0g5N0g0c1BKQko1RHp5VG0wdStObytIUHNVVWdFL0N3cTkvK01TOWMyR1lyZjRIXG5HZC8vZEpzNC9xa0Z3US9MRk4xdHNzajMzM1JkNHhyS3ZLV2RVMGZmK0w3YUh2d2FCbTBFSnpRcExseDNkek9nXG5lVEFIYVU4R3RxNEhzSWVGanZncVNOa1JnSW5Ha3ZtNWpWaHZkUXFHaXpKeXcyT3ByT1NtakczeFFlQ1huRlNaXG5oTlZ5ZDdRQ3dEM1dyQjN3V0Vna0FtbCt3aXYrbjU4NVdyT0ZUQ2lUbGpVMXpMcFJzdGRadDV3VXZNQkVucGtNXG5GTUFjS0svU1dBajArRFdUcXowNC9valRNZ3BDUVhpbGNDT1ZkUmVISFFLQmdRRHFEMGVJVUY3Y25qRGJJSlQvXG5KT25OWHNOaWJXV2tPYlZqV3ZHczEzQng4WDVZSGdhVEVCRmt2cnJDTW5VMVlVTU5VK3dkMHF5WWE2QVByT08rXG41a0FqR1EwZFV3MkRJc0lOQmN3c0twS3owTnE4VUllenY1cTNHT2xodCtVdGY5dkQrbDY3bFZ0L3JlSG9jd1lHXG5tN3I3MHZsVHNWQ0ZNTXByWjVIT2NOclU5d0tCZ1FEVFZXT1dKdFhkVVlmQXk3cGh1U0kxNWY3Vi9QWVlFakRCXG54S3lVcmMrOGNodFVjUHllN3JleHRhTURGQlJuTFBVbHFCT0wwU0tjUmN4bDR0RTRsR3NZdmhRN2JjbGNlbkpJXG5iZG5qK09aeENvM0g1VkJreVh6SHB6YnFaS0VlUVNXdENhdE1qZHpxY25kUlpZclpqdXlFdERCY0xtYWZsZlEzXG5RMGJmdkM5a1pRS0JnR3RneXg1Y1VNakJ3Z1FsZEhXQkI4bngrWTBFUnljS1dvN1VRQjlkVHZiWEpYRmpoUHllXG4ySHZ4akZoZk1hcGxqbzlrdXVRTHJLYllhVHdId3d2bk1mRm9JcjRiUmcydE9uMGk5Y0lsWGR3a3F0VE4xUk8vXG5pVWtLb3JiejJLNEJCRjlxVTErWGE3eXRsd0EvRkxxZll5NzRZTzNtWU54WnYrTjZSa2dCT2tPTkFvR0JBSkJRXG5BaFpaNUxjaVlySjhMSVZwRi94NFY0SW5JS0lsWWRnZ0JyM3N4eXZuTzlSNDUzbGNpR0k1SjkwRlREMThqTmN2XG5KRkhZK1dwL20ybUQ3dDFWTktFTHcrTWxRRmovWUtVbkpxQ3ZxaVZOVUs1TllJM0NyWXZsR3ZJS3o1OUtXNEVEXG5WaytMbkcwWXgzUDFCRkUyY1RyWmxTQ05xeFNWSU5UUUEwanJSKzJsQW9HQUJQU1oxQzJvWi9Ja1pyTHozbEtuXG5ycmhuZ0hUWEdheWM3Vmg1TGdNd0Q0c1Zmd2o0ZjR4cFE0V0pWdm9EakRLdmtuT2k1ekFiNjVKNHh2MXRsUTgwXG5sVmVBeU9seEkrb2pnSjJ3RmRZME10WWN2MHNOSktRMFFETWFkVHd0Q0w5dXlHV2VmT3AyN2xKYXVSWVJMUnllXG5VZExEN2dBYmp1VVVDdFQ2SUE3K1ZDWT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0B0b3VyLWRlc2luZy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDkxOTg3MDMzMTc3NjIzNTQ0OTgiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwdG91ci1kZXNpbmcuaWFtLmdzZXJ2aWNlYWNvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=";

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
      try {
        serviceAccount = JSON.parse(Buffer.from(embeddedB64, "base64").toString("utf-8"));
      } catch (e) {
        console.error('Failed to parse embedded B64 service account:', e);
      }
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
