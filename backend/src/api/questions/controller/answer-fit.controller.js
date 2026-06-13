import {db}  from "../../../../db/config.js";
import { evaluateAnswerFit } from "../service/answer-fit.service.js";

export const answerFitController = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { answerDraft } = req.body;

    if (!answerDraft) {
      return res.status(400).json({
        success: false,
        message: "answerDraft is required",
      });
    }

    // Get question from database
    const sql =
      "SELECT title, content FROM questions WHERE question_id = ? LIMIT 1";
    const [rows] = await db.execute(sql, [questionId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const question = `${rows[0].title}. ${rows[0].content}`;

    // Evaluate with Gemini
    const evaluation = await evaluateAnswerFit(question, answerDraft);

    res.status(200).json({
      success: true,
      questionId,
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};
