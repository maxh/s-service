import * as express from 'express';

import { endpoint } from '../infra/net';
import Lesson from '../models/Lesson';
import Transcript from '../models/Transcript';
import { teachersByName } from '../teachers/index';


interface IAnswer {
  lessonId: string;
  answerText: string;
}

const APOLOGY_TEXT = 'Sorry. I don\'t know the answer to that. Can you teach it to me?';
const ERROR_TEXT = 'Uh oh! Hit an error on the server...';
const NO_LESSON_ID = 0;

const fetchAnswer = (userId: string, transcript: string): Promise<IAnswer> => {
  return Lesson.findBestMatch(userId, transcript).then((lesson) => {
    if (!lesson) {
      return {
        lessonId: NO_LESSON_ID,
        answerText: 'I don\'t know how to do that. Can you teach me?',
      };
    }

    const params = Object.assign({}, lesson.params, { userId });
    const teacher = teachersByName[lesson.fnName];

    return teacher.exec(params).then((answer) => {
      if (!answer) {
        return { lessonId: NO_LESSON_ID, answerText: APOLOGY_TEXT };
      }
      return { lessonId: lesson.id, answerText: answer };
    });

  }).catch((error) => {
    console.error(error);
    return { lessonId: NO_LESSON_ID, answerText: ERROR_TEXT };
  });
};

const router = express.Router();

router.post('/', endpoint((req, res): Promise<IAnswer> => {
  const { userId } = req;
  const { transcript } = req.body;
  return fetchAnswer(userId, transcript).then((answer) => {
    const params = Object.assign({}, answer, { userId, transcript });
    return Transcript.log(params).then(() => answer);
  });
}));

export default router;
