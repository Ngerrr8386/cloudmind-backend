import mongoose from 'mongoose'
import { env } from './env'
import { logger } from '../utils/logger'

mongoose.set('strictQuery', true)

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('✅ MongoDB đã kết nối'))
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB lỗi'))
  mongoose.connection.on('disconnected', () => logger.warn('⚠️  MongoDB mất kết nối'))

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 5000,
  })
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
}

const STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
}

export function dbState(): string {
  return STATES[mongoose.connection.readyState] ?? 'unknown'
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1
}
