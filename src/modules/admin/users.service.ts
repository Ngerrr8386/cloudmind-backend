import bcrypt from 'bcryptjs';
import { FilterQuery } from 'mongoose';
import { User } from '../../models/User';
import { File } from '../../models/File';
import { Transaction } from '../../models/Transaction';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken } from '../../utils/jwt';
import { issueOtp } from '../auth/otp.service';
import { logAudit } from './admin.shared';
import type {
  ListUsersQuery,
  CreateUserInput,
  UpdateUserInput,
  UpdatePlanInput,
  PaginationQuery,
} from './users.validators';

interface UserFilter {
  role?: string;
  plan?: string;
  status?: string;
}

export interface PagedResult<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

async function findUserOrFail(id: string) {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng');
  }
  return user;
}

export async function listUsers(query: ListUsersQuery): Promise<PagedResult<unknown>> {
  const { page, limit, q, plan, status, role } = query;

  const filter: FilterQuery<UserFilter> = {};
  if (plan) filter.plan = plan;
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => d.toJSON()),
    meta: { page, limit, total },
  };
}

export async function getUser(id: string): Promise<unknown> {
  const user = await findUserOrFail(id);
  return user.toJSON();
}

export async function createUser(adminId: string, input: CreateUserInput): Promise<unknown> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.badRequest('Email đã được sử dụng');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    email: input.email,
    name: input.name,
    passwordHash,
    role: input.role ?? 'customer',
    plan: input.plan ?? 'Free',
    status: 'active',
    emailVerified: true,
  });

  await logAudit(adminId, {
    action: 'user.create',
    message: `Tạo người dùng mới ${user.email}`,
    severity: 'info',
    target: user.id,
    meta: { email: user.email, role: user.role, plan: user.plan },
  });

  return user.toJSON();
}

export async function updateUser(
  adminId: string,
  id: string,
  input: UpdateUserInput,
): Promise<unknown> {
  const user = await findUserOrFail(id);

  if (input.name !== undefined) user.name = input.name;
  if (input.plan !== undefined) user.plan = input.plan;
  if (input.status !== undefined) user.status = input.status;
  if (input.role !== undefined) user.role = input.role;

  await user.save();

  await logAudit(adminId, {
    action: 'user.update',
    message: `Cập nhật người dùng ${user.email}`,
    severity: 'info',
    target: user.id,
    meta: { ...input },
  });

  return user.toJSON();
}

export async function updateUserPlan(
  adminId: string,
  id: string,
  input: UpdatePlanInput,
): Promise<unknown> {
  const user = await findUserOrFail(id);
  const previousPlan = user.plan;
  user.plan = input.plan;
  await user.save();

  await logAudit(adminId, {
    action: 'user.plan.update',
    message: `Đổi gói người dùng ${user.email} từ ${previousPlan} sang ${input.plan}`,
    severity: 'info',
    target: user.id,
    meta: { from: previousPlan, to: input.plan },
  });

  return user.toJSON();
}

export async function suspendUser(adminId: string, id: string): Promise<unknown> {
  const user = await findUserOrFail(id);
  user.status = 'suspended';
  await user.save();

  await logAudit(adminId, {
    action: 'user.suspend',
    message: `Khóa người dùng ${user.email}`,
    severity: 'warning',
    target: user.id,
  });

  return user.toJSON();
}

export async function unsuspendUser(adminId: string, id: string): Promise<unknown> {
  const user = await findUserOrFail(id);
  user.status = 'active';
  await user.save();

  await logAudit(adminId, {
    action: 'user.unsuspend',
    message: `Mở khóa người dùng ${user.email}`,
    severity: 'info',
    target: user.id,
  });

  return user.toJSON();
}

export async function resetUserPassword(
  adminId: string,
  id: string,
): Promise<{ message: string; devOtp?: string }> {
  const user = await findUserOrFail(id);
  const devOtp = await issueOtp(user.email, 'reset', user.name);

  await logAudit(adminId, {
    action: 'user.reset_password',
    message: `Gửi yêu cầu đặt lại mật khẩu cho ${user.email}`,
    severity: 'info',
    target: user.id,
  });

  return {
    message: `Đã gửi mã đặt lại mật khẩu tới ${user.email}`,
    ...(devOtp ? { devOtp } : {}),
  };
}

export async function impersonateUser(
  adminId: string,
  id: string,
): Promise<{ accessToken: string; user: unknown }> {
  const user = await findUserOrFail(id);
  const accessToken = signAccessToken({ sub: user.id, role: user.role });

  await logAudit(adminId, {
    action: 'user.impersonate',
    message: `Đăng nhập với tư cách người dùng ${user.email}`,
    severity: 'warning',
    target: user.id,
  });

  return { accessToken, user: user.toJSON() };
}

export async function listUserFiles(
  id: string,
  query: PaginationQuery,
): Promise<PagedResult<unknown>> {
  await findUserOrFail(id);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const filter = { owner: id };
  const [docs, total] = await Promise.all([
    File.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    File.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => d.toJSON()),
    meta: { page, limit, total },
  };
}

export async function listUserTransactions(id: string): Promise<unknown[]> {
  await findUserOrFail(id);
  const docs = await Transaction.find({ owner: id }).sort({ createdAt: -1 });
  return docs.map((d) => d.toJSON());
}

export async function deleteUser(adminId: string, id: string): Promise<{ deleted: boolean }> {
  if (id === adminId) {
    throw ApiError.badRequest('Không thể tự xóa tài khoản của chính mình');
  }

  const user = await findUserOrFail(id);
  const email = user.email;
  await user.deleteOne();

  await logAudit(adminId, {
    action: 'user.delete',
    message: `Xóa người dùng ${email}`,
    severity: 'critical',
    target: id,
    meta: { email },
  });

  return { deleted: true };
}
