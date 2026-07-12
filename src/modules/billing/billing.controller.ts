import * as svc from './billing.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ok, created } from '../../utils/response'

export const listPlans = asyncHandler(async (_req, res) => {
  ok(res, await svc.listPlans())
})

export const getSubscription = asyncHandler(async (req, res) => {
  ok(res, await svc.getSubscription(req.user!.id))
})

export const checkout = asyncHandler(async (req, res) => {
  created(res, await svc.createCheckout(req.user!.id, req.body))
})

export const cancel = asyncHandler(async (req, res) => {
  ok(res, await svc.cancelSubscription(req.user!.id))
})

export const syncOrder = asyncHandler(async (req, res) => {
  ok(res, await svc.syncOrder(req.user!.id, Number(req.params.orderCode)))
})

export const cancelCheckout = asyncHandler(async (req, res) => {
  ok(res, await svc.cancelCheckout(req.user!.id, Number(req.params.orderCode)))
})

export const listInvoices = asyncHandler(async (req, res) => {
  ok(res, await svc.listInvoices(req.user!.id))
})

export const getInvoice = asyncHandler(async (req, res) => {
  ok(res, await svc.getInvoice(req.user!.id, req.params.id))
})
