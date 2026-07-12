import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/response';
import * as svc from './users.service';
import type {
  ListUsersQuery,
  CreateUserInput,
  UpdateUserInput,
  UpdatePlanInput,
  PaginationQuery,
} from './users.validators';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListUsersQuery;
  const result = await svc.listUsers(query);
  ok(res, result.items, result.meta);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getUser(req.params.id);
  ok(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateUserInput;
  const data = await svc.createUser(req.user!.id, body);
  created(res, data);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateUserInput;
  const data = await svc.updateUser(req.user!.id, req.params.id, body);
  ok(res, data);
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdatePlanInput;
  const data = await svc.updateUserPlan(req.user!.id, req.params.id, body);
  ok(res, data);
});

export const suspend = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.suspendUser(req.user!.id, req.params.id);
  ok(res, data);
});

export const unsuspend = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.unsuspendUser(req.user!.id, req.params.id);
  ok(res, data);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.resetUserPassword(req.user!.id, req.params.id);
  ok(res, data);
});

export const impersonate = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.impersonateUser(req.user!.id, req.params.id);
  ok(res, data);
});

export const files = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PaginationQuery;
  const result = await svc.listUserFiles(req.params.id, query);
  ok(res, result.items, result.meta);
});

export const transactions = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.listUserTransactions(req.params.id);
  ok(res, data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.deleteUser(req.user!.id, req.params.id);
  ok(res, data);
});
