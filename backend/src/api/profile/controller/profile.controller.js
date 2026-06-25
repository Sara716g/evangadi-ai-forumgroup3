import { StatusCodes } from 'http-status-codes';
import * as profileService from '../service/profile.service.js';

export const getProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let profile = await profileService.getProfileByUserId(userId);

    if (!profile) {
      profile = {
        user_id: userId,
        bio: null,
        avatar_url: null,
        location: null,
        website: null,
        first_name: req.user.firstName,
        last_name: req.user.lastName,
      };
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile fetched successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bio, location, website } = req.body;

    const profile = await profileService.createOrUpdateProfile(userId, { bio, location, website });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatarController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded.',
      });
    }

    const result = await profileService.uploadAvatar(userId, req.file);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Avatar uploaded successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
