import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Setting } from '../../models/Setting';
import { ApiError } from '../../utils/ApiError';
import { logAudit, getGlobalSettings } from './admin.shared';
import type {
  UpdateGeneralInput,
  UpdateAiInput,
  UpdateLimitsInput,
  UpdateSecurityInput,
  InviteTeamInput,
  UpdateIntegrationInput,
} from './settings.validators';

// ===== Helpers =====

interface IntegrationItem {
  key: string;
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  lastActiveAt?: Date;
}

function toTeamMember(u: {
  _id: unknown;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  lastActiveAt?: Date;
}): TeamMember {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
  };
}

// ===== Settings: read =====

export async function getSettings() {
  const s = await getGlobalSettings();
  return s.toJSON();
}

// ===== Settings: update groups =====

export async function updateGeneral(adminId: string, body: UpdateGeneralInput) {
  const s = await getGlobalSettings();
  Object.assign(s.general, body);
  s.markModified('general');
  await s.save();

  await logAudit(adminId, {
    action: 'settings.general.update',
    message: 'Cập nhật cài đặt chung',
    severity: 'info',
    meta: { fields: Object.keys(body) },
  });

  return s.toJSON();
}

export async function updateAi(adminId: string, body: UpdateAiInput) {
  const s = await getGlobalSettings();
  const { features, ...rest } = body;
  Object.assign(s.ai, rest);
  if (features) {
    Object.assign(s.ai.features, features);
  }
  s.markModified('ai');
  await s.save();

  await logAudit(adminId, {
    action: 'settings.ai.update',
    message: 'Cập nhật cài đặt AI',
    severity: 'info',
    meta: { fields: Object.keys(body) },
  });

  return s.toJSON();
}

export async function updateLimits(adminId: string, body: UpdateLimitsInput) {
  const s = await getGlobalSettings();
  Object.assign(s.limits, body);
  s.markModified('limits');
  await s.save();

  await logAudit(adminId, {
    action: 'settings.limits.update',
    message: 'Cập nhật giới hạn hệ thống',
    severity: 'info',
    meta: { fields: Object.keys(body) },
  });

  return s.toJSON();
}

export async function updateSecurity(adminId: string, body: UpdateSecurityInput) {
  const s = await getGlobalSettings();
  Object.assign(s.security, body);
  s.markModified('security');
  await s.save();

  await logAudit(adminId, {
    action: 'settings.security.update',
    message: 'Cập nhật cài đặt bảo mật',
    severity: 'warning',
    meta: { fields: Object.keys(body) },
  });

  return s.toJSON();
}

// ===== Team =====

export async function listTeam(): Promise<TeamMember[]> {
  const admins = await User.find({ role: 'admin' })
    .select('name email role createdAt lastActiveAt')
    .sort({ createdAt: -1 })
    .lean();

  return admins.map((u) => toTeamMember(u as unknown as Parameters<typeof toTeamMember>[0]));
}

export async function inviteTeam(adminId: string, body: InviteTeamInput): Promise<TeamMember> {
  const email = body.email.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      throw ApiError.badRequest('Người dùng đã là quản trị viên');
    }
    existing.role = 'admin';
    await existing.save();

    await logAudit(adminId, {
      action: 'team.invite',
      message: `Nâng quyền quản trị cho ${existing.email}`,
      severity: 'warning',
      target: String(existing._id),
      meta: { email: existing.email, promoted: true },
    });

    return toTeamMember(existing as unknown as Parameters<typeof toTeamMember>[0]);
  }

  const randomPw = crypto.randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(randomPw, 10);

  const created = await User.create({
    email,
    name: body.name ?? email.split('@')[0],
    role: 'admin',
    emailVerified: true,
    passwordHash,
  });

  await logAudit(adminId, {
    action: 'team.invite',
    message: `Tạo tài khoản quản trị mới ${created.email}`,
    severity: 'warning',
    target: String(created._id),
    meta: { email: created.email, created: true },
  });

  return toTeamMember(created as unknown as Parameters<typeof toTeamMember>[0]);
}

export async function updateRole(
  adminId: string,
  userId: string,
  role: 'admin' | 'customer'
): Promise<TeamMember> {
  if (userId === adminId && role !== 'admin') {
    throw ApiError.badRequest('Bạn không thể tự hạ quyền chính mình');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng');
  }

  const prevRole = user.role;
  if (prevRole === role) {
    return toTeamMember(user as unknown as Parameters<typeof toTeamMember>[0]);
  }

  user.role = role;
  await user.save();

  await logAudit(adminId, {
    action: 'team.role.update',
    message: `Đổi vai trò ${user.email} từ ${prevRole} thành ${role}`,
    severity: 'warning',
    target: String(user._id),
    meta: { email: user.email, from: prevRole, to: role },
  });

  return toTeamMember(user as unknown as Parameters<typeof toTeamMember>[0]);
}

export async function removeTeamMember(adminId: string, userId: string): Promise<TeamMember> {
  if (userId === adminId) {
    throw ApiError.badRequest('Bạn không thể tự hạ quyền chính mình');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng');
  }

  if (user.role !== 'admin') {
    throw ApiError.badRequest('Người dùng không phải là quản trị viên');
  }

  user.role = 'customer';
  await user.save();

  await logAudit(adminId, {
    action: 'team.remove',
    message: `Hạ quyền quản trị của ${user.email}`,
    severity: 'warning',
    target: String(user._id),
    meta: { email: user.email },
  });

  return toTeamMember(user as unknown as Parameters<typeof toTeamMember>[0]);
}

// ===== Integrations =====

export async function listIntegrations(): Promise<IntegrationItem[]> {
  const s = await getGlobalSettings();
  const integrations = (s.integrations ?? []) as unknown as IntegrationItem[];
  return integrations.map((i) => ({
    key: i.key,
    name: i.name,
    enabled: i.enabled,
    config: i.config,
  }));
}

export async function updateIntegration(
  adminId: string,
  key: string,
  body: UpdateIntegrationInput
): Promise<IntegrationItem> {
  const s = await getGlobalSettings();
  const integrations = (s.integrations ?? []) as unknown as IntegrationItem[];
  const item = integrations.find((i) => i.key === key);

  if (!item) {
    throw ApiError.notFound('Không tìm thấy tích hợp');
  }

  if (typeof body.enabled === 'boolean') {
    item.enabled = body.enabled;
  }
  if (body.config !== undefined) {
    item.config = body.config;
  }

  s.markModified('integrations');
  await s.save();

  await logAudit(adminId, {
    action: 'integration.update',
    message: `Cập nhật tích hợp ${item.name}`,
    severity: 'info',
    target: key,
    meta: { key, enabled: item.enabled },
  });

  return {
    key: item.key,
    name: item.name,
    enabled: item.enabled,
    config: item.config,
  };
}
