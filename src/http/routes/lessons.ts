import * as express from 'express';

import Lesson from '../../models/Lesson';
import { endpoint } from '../../infra/net';


const router = express.Router();

router.get('/', endpoint((req, res) => {
  const { userId } = req;
  return Lesson.getAll(userId).then(lessons => {
    return {
      lessons: lessons.map(lesson => lesson.serialize())
    };
  });
}));

router.post('/', endpoint((req, res) => {
  // TODO: Check permissions for the lesson.
  const { userId } = req;
  const { utterance, fnName, params } = req.body;
  const lessonParams = {
    utterance,
    fnName,
    params,
    userId,
  };
  return Lesson.create(lessonParams).then(lesson => {
    return lesson.serialize();
  });
}));

router.delete('/:lessonId', endpoint((req, res) => {
  const { userId } = req;
  const { lessonId } = req.params;
  return Lesson.delete(userId, lessonId);
}));

export default router;
