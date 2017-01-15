import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


export interface ILesson {
  question: string;
  fnName: string;
  userId: string;
  params: Object;
}

const _schema = new mongoose.Schema({
  question: String,
  fnName: String,
  userId: String,
  params: Object,
});
_schema.plugin(mongooseTimestamp);

const _model = mongoose.model('Lesson', _schema);


class Lesson {
  public static create(params: ILesson): Promise<Lesson> {
    return _model.create(params).then(doc => {
      return new Lesson(doc);
    });
  }

  public static getAll(userId: string): Promise<Lesson[]> {
    return _model.find({userId}).then(docList => {
      return docList.map(doc => new Lesson(doc));
    });
  }

  public static delete(userId: string, lessonId: string): Promise<undefined> {
    return _model.remove({userId, lessonId}).then(() => {
      // Return nothing if the deletion succeeded.
      return undefined;
    });
  }

  private _document: ILesson & mongoose.Document;

  constructor(document) {
    this._document = document;
  }

  public getJson(): ILesson {
    return {
      question: this._document.question,
      fnName: this._document.fnName,
      userId: this._document.userId,
      params: this._document.params,
    };
  }
}

export default Lesson;
