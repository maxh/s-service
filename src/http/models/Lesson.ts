import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


export interface ILesson {
  id?: string;
  utterance: string;
  fnName: string;
  userId: string;
  params: Object;
}


// Helpers.


const STOP_WORDS = new Set([
  'a', 'the', 'is', 'are', 'am', 'of', 'do', 'what', 'whats',
  'where', 'how', 'who', 'it', 'have', 'will',
]);

const MATCH_THRESHOLD = 0.6;

const findBestFuzzyMatch = (transcript: string, lessons: Lesson[]): Lesson => {
  function arrToObj(a) {
    const x = {};
    a.forEach(function(v) {
      v = v.replace(/\W+/g, '');
      x[v] = true;
    });
    return x;
  }

  const bestMatch = { score: -1, lesson: null };

  const wordSet = arrToObj(transcript.toLowerCase().split(' '));

  lessons.forEach(function(lesson) {
    const lessonSplit = lesson.utterance.toLowerCase().split(' ');
    const lessonWordSet = arrToObj(lessonSplit);

    // compute the %age words in common
    let commonWords = 0;
    let lessonLen = 0;

    for (const word in lessonWordSet) {
      if (wordSet[word]) {
        commonWords++;
        lessonLen++;
      } else if (!STOP_WORDS.has(word)) {
        lessonLen++;
      }
    }

    const score = commonWords / lessonLen;
    if (score > bestMatch.score) {
      bestMatch.score = score;
      bestMatch.lesson = lesson;
    }
  });

  if (bestMatch.lesson) {
    console.log('Best match for ' + transcript + ' is \'' +
        bestMatch.lesson.utterance + '\' with score of ' +
        bestMatch.score);
  }
  if (bestMatch.score >= MATCH_THRESHOLD) {
    return bestMatch.lesson;
  }

  return null;
};


// Model.


const schema = new mongoose.Schema({
  utterance: String,
  fnName: String,
  userId: String,
  params: Object,
});
schema.plugin(mongooseTimestamp);

const model = mongoose.model('Lesson', schema);

class Lesson {
  public static create(params: ILesson): Promise<Lesson> {
    return model.create(params).then(doc => {
      return new Lesson(doc);
    });
  }

  public static getAll(userId: string): Promise<Lesson[]> {
    return model.find({ userId }).then(docList => {
      return docList.map(doc => new Lesson(doc));
    });
  }

  public static delete(userId: string, lessonId: string): Promise<undefined> {
    return model.remove({ userId, lessonId }).then(() => {
      // Resolve to nothing if the deletion succeeded.
      return undefined;
    });
  }

  public static findBestMatch(userId, transcript): Promise<ILesson|null>  {
    return Lesson.getAll(userId).then((lessons) => {
      const lesson = findBestFuzzyMatch(transcript, lessons);
      if (lesson) {
        return lesson.serialize();
      } else {
        return null;
      }
    });
  }

  private document: ILesson & mongoose.Document;

  constructor(document) {
    this.document = document;
  }

  public serialize(): ILesson {
    return {
      id: this.document.id,
      utterance: this.document.utterance,
      fnName: this.document.fnName,
      userId: this.document.userId,
      params: this.document.params,
    };
  }

  get utterance() {
    return this.document.utterance;
  }
}

export default Lesson;
