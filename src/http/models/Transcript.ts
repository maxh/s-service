import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


export interface ITranscript {
  userId: string;
  transcript: string;
  lessonId?: string;
  answerText?: string;
}

const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  transcript: { type: String, required: true },
  lessonId: String,
  answerText: String,
});
schema.plugin(mongooseTimestamp);

const model = mongoose.model('Transcript', schema);


class Transcript {
  public static log(params: ITranscript): Promise<Transcript> {
    return model.create(params).then(doc => new Transcript(doc));
  }

  private document: ITranscript & mongoose.Document;

  constructor(document) {
    this.document = document;
  }
}

export default Transcript;
