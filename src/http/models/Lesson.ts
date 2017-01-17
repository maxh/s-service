import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


export interface ILesson {
  id?: string;
  question: string;
  fnName: string;
  userId: string;
  params: Object;
}

const schema = new mongoose.Schema({
  question: String,
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

  private document: ILesson & mongoose.Document;

  constructor(document) {
    this.document = document;
  }

  public serialize(): ILesson {
    return {
      id: this.document.id,
      question: this.document.question,
      fnName: this.document.fnName,
      userId: this.document.userId,
      params: this.document.params,
    };
  }
}

export default Lesson;
