import admin from 'firebase-admin'
import { env, firebaseConfigured } from './env'
import { logger } from '../utils/logger'
import { ApiError } from '../utils/ApiError'

let app: admin.app.App | null = null

/** Khởi tạo Firebase Admin (chung cho Auth + Storage). Bỏ qua nếu chưa cấu hình. */
export function initFirebase(): void {
  if (!firebaseConfigured) {
    logger.warn('⚠️  Firebase chưa cấu hình — đăng nhập Google & Storage sẽ bị tắt')
    return
  }
  if (app) return
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Khôi phục xuống dòng trong private key từ biến môi trường
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  })
  logger.info('✅ Firebase Admin đã khởi tạo')
}

export const isFirebaseReady = (): boolean => app !== null

export function getFirebaseAuth(): admin.auth.Auth {
  if (!app) throw ApiError.unavailable('Firebase Auth chưa được cấu hình trên máy chủ')
  return app.auth()
}

export function getBucket(): ReturnType<admin.storage.Storage['bucket']> {
  if (!app) throw ApiError.unavailable('Firebase Storage chưa được cấu hình trên máy chủ')
  return app.storage().bucket()
}
