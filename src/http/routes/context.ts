import * as express from 'express';

import Lesson from '../models/Lesson';

import { endpoint } from '../infra/net';


const STRIP_CHAR = '?';
const router = express.Router();

const deduplicate = function(a) {
  return a.sort().filter(function(item, pos, array) {
    return !pos || item !== array[pos - 1];
  });
};

router.get('/', endpoint((req, res) => {
  const { userId } = req;
  return Lesson.getAll(userId).then(lessons => {
    let contextWords = [];
    const splitUtterances = lessons.map(lesson => lesson.utterance.split(' '));
    if (splitUtterances.length > 0) {
      const rawWords = splitUtterances.reduce((a, b) => a.concat(b));
      const words = rawWords.map((rawWord) => {
        return rawWord.toLowerCase().replace(STRIP_CHAR, '');
      });
      contextWords = deduplicate(words);
    }
    return { context: contextWords };
  });
}));

export default router;
