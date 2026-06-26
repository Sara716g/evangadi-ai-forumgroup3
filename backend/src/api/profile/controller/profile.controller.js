import { getProfileService, updateProfileService, addCredentialService, deleteCredentialService, uploadAvatarService } from '../service/profile.service.js';

export const getProfileController = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const profile = await getProfileService(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getMyProfileController = async (req, res, next) => {
  try {
    const profile = await getProfileService(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (req, res, next) => {
  try {
    const profile = await updateProfileService(req.user.id, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatarController = async (req, res, next) => {
  try {
    const profile = await uploadAvatarService(req.user.id, req.file);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const addCredentialController = async (req, res, next) => {
  try {
    const profile = await addCredentialService(req.user.id, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const deleteCredentialController = async (req, res, next) => {
  try {
    const profile = await deleteCredentialService(req.user.id, req.params.credentialId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};
