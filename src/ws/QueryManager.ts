import * as crypto from 'crypto';
import * as apiai from 'apiai';

import settings from '../settings';

import { IAnswer } from '../http/teachers/interface';

import { SCOUT_WEB_HOOK_SOURCE } from '../http/routes/query-hook';


// tslint:disable:next-line no-var-requires
const SPEECH_CONTEXT = require(process.cwd() + '/data/speechContext.json').context;


export interface IQueryLocation {
  latitude: string;
  longitude: string;
}

export interface IQueryOptions {
  lang: string;
  sessionId: string;
  contexts?: Object[];
  location?: IQueryLocation;
  timezone?: string;
  entities?: Object[];
}

export interface IQueryResult {
  source: string;
  resolvedQuery: string;
  action: string;
  actionIncomplete: boolean;
  parameters: Object[];
  contexts: Object[];
  metadata: Object;
  fulfillment: any;
}

export interface IQueryResponse {
  id: string;
  timestamp: string;
  result: IQueryResult;
  status: Object;
  sessionId: string;
}

const sendApiAiQuery = function(
    agentAccessToken: string,
    query: string,
    options: IQueryOptions): Promise<IQueryResponse> {
  if (settings.isDev) {
    console.log('Sending API.ai query: ');
    console.log(agentAccessToken, query, options);
    console.log('');
  }
  const agent = apiai(agentAccessToken);
  return new Promise((resolve, reject) => {
    const request = agent.textRequest(query, options);
    request.on('response', resolve);
    request.on('error', reject);
    request.end();
  });
};


class QueryManager {

  private agentAccessToken: string;
  private sessionId: string;
  private contexts: Object[];
  private speechContextPromise: Promise<string[]>;
  private userId: string;

  constructor(agentAccessToken, userId) {
    this.userId = userId;
    this.agentAccessToken = agentAccessToken;
    this.sessionId = crypto.randomBytes(10).toString('hex');
  }

  public getSpeechContextPromise(): Promise<string[]> {
    // https://cloud.google.com/speech/limits#content
    // Limits: chars per request < 10000, phrases < 500, chars per phrase < 100
    // TODO: call API.ai entities and intents endpoints
    if (!this.speechContextPromise) {
      const limitedContext = SPEECH_CONTEXT.slice(0, 500);
      this.speechContextPromise = Promise.resolve(limitedContext);
    }
    return this.speechContextPromise;
  }

  public getAnswer(transcript): Promise<IAnswer> {
    return (this.sendQuery(transcript).then(response => {
      if (response.result.fulfillment.source === SCOUT_WEB_HOOK_SOURCE) {
        return JSON.parse(response.result.fulfillment.speech);
      } else {
        return {
          speech: response.result.fulfillment.speech,
          display: response.result.fulfillment.speech
        };
      }
    }).catch(error => {
      console.error('Error processing answer: ');
      console.error(error);
      console.log('');
      return { display: 'Error processing answer.' };
    }));
  }

  private sendQuery(transcript) {
    const options = {
      sessionId: this.sessionId,
      lang: 'en',
      originalRequest: {
        data: { userId: this.userId }
      }
    } as IQueryOptions;
    if (this.contexts) {
      options.contexts = this.contexts;
    }
    return sendApiAiQuery(this.agentAccessToken, transcript, options).then(response => {
      if (settings.isDev) {
        console.log('Got response from API.AI: ');
        console.log(response);
        console.log('');
      }
      this.contexts = response.result.contexts;
      return response;
    });
  }
}

export default QueryManager;
