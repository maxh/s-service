import * as crypto from 'crypto';
import * as apiai from 'apiai';

import settings from '../settings';

import { IAnswer } from '../http/teachers/interface';


const CONTEXT_PHRASES = [
  'Where is',
  'wikipedia',
  'show me the lab protocol for',
  'whats the lab protocol for cyropreservation',
  'whats the lab protocol for',
  'let me see the lab protocol for',
  'lab protocol',
  'What is my next meeting',
  'When is my next meeting',
  'What and when is your next meeting',
  'What is the diameter of a human keratinocyte',
  'keratinocyte',
  'carcinoma',
  'freezing media',
  'antibiotics',
  'recovering frozen cells',
  'cryopreservation serum',
  'cryopreservation with serum',
  'cryopreservation without serum',
  'cryopreservation serumfree',
  'cryopreservation no serum',
  'thawing serum',
];

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
      this.speechContextPromise = Promise.resolve(CONTEXT_PHRASES);
    }
    return this.speechContextPromise;
  }

  public getAnswer(transcript): Promise<IAnswer> {
    return (this.sendQuery(transcript).then(response => {
      return JSON.parse(response.result.fulfillment.speech);
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
