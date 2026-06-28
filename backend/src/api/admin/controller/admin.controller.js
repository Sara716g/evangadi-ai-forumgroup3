import { StatusCodes } from 'http-status-codes';
import * as adminService from '../service/admin.service.js';

export const getStatsController = async (req, res, next) => {
  try {
    const stats = await adminService.getStatsService();

    return res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersController = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.getAllUsersService({ page, limit, search });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatusController = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const userId = Number(req.params.userId);
    const { status } = req.body;

    const result = await adminService.updateUserStatusService(userId, status, adminId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'User status updated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserRoleController = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const userId = Number(req.params.userId);

    const result = await adminService.toggleUserRoleService(userId, adminId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'User role updated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsController = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.getAllQuestionsService({ page, limit, search });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    await adminService.deleteQuestionService(questionHash);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    await adminService.deleteAnswerService(Number(answerId));

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
