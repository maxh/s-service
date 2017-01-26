import * as url from 'url';

import QueryManager from './QueryManager';
import { createRecognizeStream } from './recognition';

import { getUserIdFromJwtPromise } from '../infra/auth';

import settings from '../settings';


enum State {
  AWAITING_SAMPLE_RATE,
  CONFIGURING_RECOGNIZE,
  READY,
  FINDING_ANSWER,
  CLOSED,
}

// TODO: Add CLIENT_LOCATION, with lat/lon and timezone, to send to api.ai.
/** @enum Socket message types. */
const MessageType = {
  // From the client.
  CLIENT_SAMPLE_RATE: 'CLIENT_SAMPLE_RATE',
  CLIENT_END_OF_SPEECH: 'CLIENT_END_OF_SPEECH',
  CLIENT_TRANSCRIPT: 'CLIENT_TRANSCRIPT', // used mostly for debugging

  // From the server.
  SERVER_ANSWER: 'SERVER_ANSWER',
  SERVER_TRANSCRIPT: 'SERVER_TRANSCRIPT',
  SERVER_IS_READY: 'SERVER_IS_READY',
  SERVER_SPEECH_ENDED: 'SERVER_SPEECH_ENDED',
};


class StreamManager {

  private socket: any;
  private recognizeStream: any;
  private token: string;
  private state: State;
  private queryManagerPromise: Promise<QueryManager>;

  constructor(socket) {
    this.socket = socket;
    const location = url.parse(socket.upgradeReq.url, true);
    this.token = location.query.jwt;
    this.state = State.AWAITING_SAMPLE_RATE;
  }

  public startListening() {
    // TODO(max): Support different access tokens.
    const agentAccessToken = settings.auth.keys.acornApiAiAgentAccessToken;
    this.queryManagerPromise = getUserIdFromJwtPromise(this.token)
        .then(userId => new QueryManager(agentAccessToken, userId))
        .catch(e => this.close('Invalid token.'));
    this.socket.on('message', this.onSocketMessage.bind(this));
    this.socket.on('close', this.close.bind(this, 'Close event handled.'));
  }

  private close(error) {
    console.error('Socket closed: ', error);
    // See https://tools.ietf.org/html/rfc6455#section-7.4.2
    const DEFAULT_WS_APPLICATION_ERROR_CODE = 4000;
    this.socket.close(DEFAULT_WS_APPLICATION_ERROR_CODE, error);

    if (this.recognizeStream) {
      this.recognizeStream.destroy();
    }
    this.state = State.CLOSED;
  }

  // WebSocket handlers.

  private onSocketMessage(message) {
    if (message instanceof Buffer) {
      this.onSocketAudio(message);
    } else if (typeof message === 'string') {
      this.onSocketConfig(message);
    } else {
      this.socket.close('Socket message has unknown data type');
    }
  }

  private onSocketConfig(configString: string) {
    let config;
    try {
      config = JSON.parse(configString);
    } catch (e) {
      this.close(e);
      return;
    }

    /* tslint:disable:ter-indent */
    switch (config.type) {
      case MessageType.CLIENT_SAMPLE_RATE:
        if (!config.sampleRate) {
          this.close('Must specify sample rate when setting sample rate');
          return;
        }
        if (this.state === State.AWAITING_SAMPLE_RATE) {
          this.configureRecognizeStream(config.sampleRate);
        } else {
          this.close(`Got sample rate but was in state ${this.state}`);
        }
        break;

      case MessageType.CLIENT_END_OF_SPEECH:
        if (this.state === State.READY) {
          // TODO: do something smart here?
        } else {
          this.close('Sent end of speech but not in the ready state');
        }
        break;

      case MessageType.CLIENT_TRANSCRIPT:
        this.onTranscriptReceived(config.transcript);
        break;

      default:
        this.close(`Unknown message type ${config.type}`);
    }
    /* tslint:enable:ter-indent */
  }

  private onSocketAudio(audioData: Buffer) {
    if (this.state === State.READY) {
      this.recognizeStream.write(audioData);
    } else if (this.state === State.FINDING_ANSWER) {
      // audio came in after we decided that speech ended. this can
      // happen because of some latency between client and server
      // sending the end speech signal
    } else {
      this.close('Got audio data before ready');
    }
  }

  private sendOnSocket(message: Object) {
    this.socket.send(JSON.stringify(message));
  }

  private onRecognizeError(error) {
    // keep this empty for now, since we pick up the err message
    // w/ more context when there's an error
  }

  // Google Speech Recognition API handlers.

  private configureRecognizeStream(sampleRate) {
    this.state = State.CONFIGURING_RECOGNIZE;

    this.queryManagerPromise.then(queryManager => {
      return queryManager.getSpeechContextPromise();
    }).then(context => {
      this.recognizeStream = createRecognizeStream(sampleRate, context);
      this.recognizeStream.on('data', this.onRecognizeData.bind(this));
      this.recognizeStream.on('error', this.onRecognizeError.bind(this));
      this.state = State.READY;
      this.sendOnSocket({ type: MessageType.SERVER_IS_READY });
    });

  }

  private onTranscriptReceived(transcript) {
    this.state = State.FINDING_ANSWER;

    if (this.recognizeStream) {
      this.recognizeStream.destroy();
      this.recognizeStream = null;
    }

    this.sendOnSocket({ type: MessageType.SERVER_SPEECH_ENDED });
    this.sendOnSocket({ type: MessageType.SERVER_TRANSCRIPT, transcript });

    this.queryManagerPromise
        .then(queryManager => queryManager.getAnswer(transcript))
        .then((answer) => {
          this.sendOnSocket({ type: MessageType.SERVER_ANSWER, answer });
          this.state = State.AWAITING_SAMPLE_RATE;
        })
        .catch((error) => {
          this.close(`Error getting answer: ${error}`);
        });
  }

  private onRecognizeData(data) {
    console.log(JSON.stringify({ msg: data }));

    if (data.error) {
      this.close(data.error.message);
      return;
    }

    if (data.endpointerType === 'START_OF_SPEECH') {
      console.log('Speech start.');
    } else if (data.endpointerType === 'END_OF_SPEECH') {
      console.log('Speech end.');
    }

    if (data.results) {
      const bestResult = data.results[0];
      if (bestResult && bestResult.isFinal) {
        this.onTranscriptReceived(bestResult.transcript);
      }
    }
  }
}

export default StreamManager;
