import { Types } from 'mongoose';
import { Workspace } from '../../models/Workspace';
import { WorkspaceMember } from '../../models/WorkspaceMember';
import { User } from '../../models/User';
import { Subscription } from '../../models/Subscription';
import { ApiError } from '../../utils/ApiError';
import { logAudit } from './admin.shared';

export interface ListWorkspacesQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: 'active' | 'suspended';
}

interface OwnerLean {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
}

interface WorkspaceLean {
  _id: Types.ObjectId;
  name: string;
  owner?: OwnerLean | Types.ObjectId | null;
  seats: number;
  status: 'active' | 'suspended';
  createdAt: Date;
}

function isPopulatedOwner(owner: WorkspaceLean['owner']): owner is OwnerLean {
  return !!owner && typeof owner === 'object' && 'email' in owner;
}

function shapeWorkspace(ws: WorkspaceLean, memberCount: number) {
  const owner = ws.owner;
  const populated = isPopulatedOwner(owner) ? owner : null;
  return {
    id: ws._id.toString(),
    name: ws.name,
    ownerId: populated
      ? populated._id.toString()
      : owner
        ? (owner as Types.ObjectId).toString()
        : null,
    ownerName: populated?.name ?? null,
    ownerEmail: populated?.email ?? null,
    seats: ws.seats,
    status: ws.status,
    memberCount,
    createdAt: ws.createdAt,
  };
}

export async function listWorkspaces(query: ListWorkspacesQuery) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.q && query.q.trim()) {
    filter.name = { $regex: query.q.trim(), $options: 'i' };
  }

  const [docs, total] = await Promise.all([
    Workspace.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<WorkspaceLean[]>(),
    Workspace.countDocuments(filter),
  ]);

  const items = await Promise.all(
    docs.map(async (ws) => {
      const memberCount = await WorkspaceMember.countDocuments({ workspace: ws._id });
      return shapeWorkspace(ws, memberCount);
    }),
  );

  return { items, page, limit, total };
}

export async function getWorkspace(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID workspace không hợp lệ');
  }

  const ws = await Workspace.findById(id)
    .populate('owner', 'name email')
    .lean<WorkspaceLean | null>();

  if (!ws) {
    throw ApiError.notFound('Không tìm thấy workspace');
  }

  const memberCount = await WorkspaceMember.countDocuments({ workspace: ws._id });
  return shapeWorkspace(ws, memberCount);
}

interface MemberLean {
  _id: Types.ObjectId;
  workspace: Types.ObjectId;
  user?: OwnerLean | Types.ObjectId | null;
  wsRole: 'owner' | 'wsadmin' | 'member';
  joinedAt: Date;
}

export async function listWorkspaceMembers(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID workspace không hợp lệ');
  }

  const exists = await Workspace.exists({ _id: id });
  if (!exists) {
    throw ApiError.notFound('Không tìm thấy workspace');
  }

  const members = await WorkspaceMember.find({ workspace: id })
    .populate('user', 'name email')
    .sort({ joinedAt: 1 })
    .lean<MemberLean[]>();

  return members.map((m) => {
    const user = m.user;
    const populated = isPopulatedOwner(user) ? user : null;
    return {
      id: m._id.toString(),
      workspaceId: m.workspace.toString(),
      userId: populated
        ? populated._id.toString()
        : user
          ? (user as Types.ObjectId).toString()
          : null,
      userName: populated?.name ?? null,
      userEmail: populated?.email ?? null,
      wsRole: m.wsRole,
      joinedAt: m.joinedAt,
    };
  });
}

export async function suspendWorkspace(adminId: string, id: string, suspend: boolean) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID workspace không hợp lệ');
  }

  const ws = await Workspace.findById(id);
  if (!ws) {
    throw ApiError.notFound('Không tìm thấy workspace');
  }

  ws.status = suspend ? 'suspended' : 'active';
  await ws.save();

  await logAudit(adminId, {
    action: suspend ? 'workspace.suspend' : 'workspace.unsuspend',
    severity: 'warning',
    message: suspend
      ? `Đã tạm khóa workspace "${ws.name}"`
      : `Đã mở khóa workspace "${ws.name}"`,
    target: ws._id.toString(),
    meta: { status: ws.status },
  });

  const memberCount = await WorkspaceMember.countDocuments({ workspace: ws._id });
  const fresh = await Workspace.findById(ws._id)
    .populate('owner', 'name email')
    .lean<WorkspaceLean | null>();

  return shapeWorkspace(fresh ?? (ws.toJSON() as unknown as WorkspaceLean), memberCount);
}

export async function updateWorkspaceSeats(adminId: string, id: string, seats: number) {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('ID workspace không hợp lệ');
  }

  const ws = await Workspace.findById(id);
  if (!ws) {
    throw ApiError.notFound('Không tìm thấy workspace');
  }

  ws.seats = seats;
  await ws.save();

  await Subscription.updateOne(
    { owner: ws.owner, planKey: 'team' },
    { $set: { seats } },
  );

  await logAudit(adminId, {
    action: 'workspace.seats.update',
    severity: 'info',
    message: `Đã cập nhật số ghế workspace "${ws.name}" thành ${seats}`,
    target: ws._id.toString(),
    meta: { seats },
  });

  const memberCount = await WorkspaceMember.countDocuments({ workspace: ws._id });
  const fresh = await Workspace.findById(ws._id)
    .populate('owner', 'name email')
    .lean<WorkspaceLean | null>();

  return shapeWorkspace(fresh ?? (ws.toJSON() as unknown as WorkspaceLean), memberCount);
}
