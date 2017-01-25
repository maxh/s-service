import * as fetch from 'isomorphic-fetch';
import * as url from 'url';

import { createRecognizeStream } from './recognition';

import settings from '../settings';

const callApi = (token, resourceName, options: any = {}) => {
  const url = settings.httpServerUrl + '/api/' + resourceName;

  const authedOptions: any = Object.assign({}, options);
  if (!authedOptions.headers) {
    authedOptions.headers = {};
  }
  authedOptions.headers.authorization = 'Scout JWT ' + token;

  if (!authedOptions.body) {
    authedOptions.headers['content-type'] = 'text/plain';
  } else if (!authedOptions.headers['content-type']) {
    authedOptions.headers['content-type'] = 'application/json';
  }

  return fetch(url, authedOptions).then((response) => {
    if (!response.ok) {
      console.log();
      console.error(`Network request failed!`);
      console.error(`URL: ${url}`);
      console.error(`Options: ${JSON.stringify(options)}`);
      console.error(`Status code: ${response.status}`);
      console.error(`Status text: ${response.statusText}`);
      console.log();
    }
    return response.json();
  });
};

enum State {
  CREATED,
  CONFIGURING_RECOGNIZE,
  READY,
  FINDING_ANSWER,
  CLOSED,
}

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

  // A promise that resolves to the lessons context for this user.
  private contextPromise: Promise<string>;

  constructor(socket) {
    this.socket = socket;
    const location = url.parse(socket.upgradeReq.url, true);
    this.token = location.query.jwt;
    this.state = State.CREATED;
  }

  public startListening() {
    this.socket.on('message', this.onSocketMessage.bind(this));
    this.socket.on('close', this.close.bind(this, 'Close event handled.'));
    // TODO: Automatically refresh the context if a lesson is added.
    // Note: This promise will be rejected if the HTTP server rejects the JWT.

    /*
    this.contextPromise = callApi(this.token, 'context')
        .catch(this.close.bind(this));
    */
    this.contextPromise = null;
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
        if (this.state === State.CREATED) {
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

    this.recognizeStream = createRecognizeStream(sampleRate, []);
    this.recognizeStream.on('data', this.onRecognizeData.bind(this));
    this.recognizeStream.on('error', this.onRecognizeError.bind(this));

    this.state = State.READY;

    this.sendOnSocket({ type: MessageType.SERVER_IS_READY });
  }

  private onTranscriptReceived(transcript) {
    this.state = State.FINDING_ANSWER;

    if (this.recognizeStream) {
      this.recognizeStream.destroy();
      this.recognizeStream = null;
    }

    this.sendOnSocket({ type: MessageType.SERVER_SPEECH_ENDED });
    this.sendOnSocket({ type: MessageType.SERVER_TRANSCRIPT, transcript });
    this.getAnswer(transcript).then((answer) => {
      this.sendOnSocket({
        type: MessageType.SERVER_ANSWER,
        answerText: answer.answerText,
        lessonId: answer.lessonId,
      });
      this.state = State.CREATED;
    }).catch((error) => {
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

  private getAnswer(transcript) {
    return callApi(this.token, 'answers', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });
  }
}

export default StreamManager;
