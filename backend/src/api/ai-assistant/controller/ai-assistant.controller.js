import { generateAssistantResponseService } from "../service/ai-assistant.service.js";
import { BadRequestError } from "../../../utils/errors/index.js"; 

export const getAssistantAnswer = async (req, res, next) => {
  try {
    
    const { question, history = [] } = req.body;

    // Grabbing the user ID from the auth token payload
    const userId = req.user?.id || req.user?.user_id;

    if (!question) {
      throw new BadRequestError(
        "Please provide a question for the AI Assistant.",
      );
    }

    const answer = await generateAssistantResponseService(
      userId,
      question,
      history,
    );

    res.status(200).json({
      success: true,
      data: {
        answer: answer,
      },
    });
  } catch (error) {
    next(error);
  }
};
