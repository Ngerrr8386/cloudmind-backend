import type { Role } from '../utils/jwt'
import type { WsRole } from '../models/WorkspaceMember'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: Role
      }
      workspaceId?: string
      wsRole?: WsRole
    }
  }
}

export {}
