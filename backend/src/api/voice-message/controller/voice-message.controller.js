import { StatusCodes } from 'http-status-codes';
import path from 'path';
import * as voiceMessageService from '../service/voice-message.service.js';

export const uploadVoiceMessageController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No audio file provided.',
      });
    }

    const userId = req.user.id;
    const { duration, questionId, answerId } = req.body;

    const result = await voiceMessageService.uploadVoiceMessage({
      userId,
      audioFile: req.file,
      duration: Number(duration),
      questionId,
      answerId,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Voice message uploaded successfully.',
      voiceMessage: {
        ...result,
        fileUrl: `/api/voice-messages/${result.id}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVoiceMessageController = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const voiceMessage = await voiceMessageService.getVoiceMessageById(Number(messageId));

    return res.status(StatusCodes.OK).json({
      success: true,
      voiceMessage: {
        ...voiceMessage,
        fileUrl: `/api/voice-messages/${voiceMessage.voice_message_id}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const streamVoiceMessageController = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const voiceMessage = await voiceMessageService.getVoiceMessageById(Number(messageId));

    const filePath = path.resolve(voiceMessage.file_path);
    res.setHeader('Content-Type', voiceMessage.file_type);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};
