import * as express from 'express';

import Lesson from '../models/Lesson';

import { endpoint } from '../infra/net';


const router = express.Router();


router.get('/', endpoint((req, res) => {
  return Lesson.getAll(req.userId).then(lessons => {
    return {
      lessons: lessons.map(lesson => lesson.serialize())
    };
  });
}));


router.post('/', endpoint((req, res) => {
  const {question, fnName, params} = req.body;
  const lessonParams = {
    question,
    fnName,
    params,
    userId: req.userId,
  };
  return Lesson.create(lessonParams).then(lesson => {
    return lesson.serialize();
  });
}));


router.delete('/:lessonId', endpoint((req, res) => {
  return Lesson.delete(req.userId, req.params.lessonId);
}));


export default router;
