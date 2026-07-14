import { Response } from 'express';
import * as branchService from '../services/branch.service';
import { sendCreated, sendSuccess, parsePagination } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { items, pagination } = await branchService.listBranches(page, limit, skip);
  sendSuccess(res, items, 200, pagination);
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branch = await branchService.createBranch(req.body);
  sendCreated(res, branch);
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  sendSuccess(res, branch);
});

export const stats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await branchService.getBranchStats(req.params.id);
  sendSuccess(res, result);
});
