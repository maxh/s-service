import * as fetch from 'isomorphic-fetch';
import * as url from 'url';

import { createRecognizeStream } from './recognition';

import settings from '../settings';


const callApi = (token, resourceName, options = {}) => {
  const url = settings.webServerUrl + '/api/' + resourceName;

  const authedOptions: any = Object.assign({}, options);
  if (!authedOptions.headers) {
    authedOptions.headers = {};
  }
  authedOptions.headers.authorization = 'Scout JWT ' + token;

  return fetch(url, options).then((response) => {
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
  CLOSED,
}

/** @enum Socket message types. */
const MessageType = {
  // From the client.
  CLIENT_SAMPLE_RATE: 'CLIENT_SAMPLE_RATE',

  // From the server.
  SERVER_ANSWER: 'SERVER_ANSWER',
  SERVER_TRANSCRIPT: 'SERVER_TRANSCRIPT',
  SERVER_IS_READY: 'SERVER_IS_READY',
};

class StreamManager {

  private socket: any;
  private recognizeStream: any;
  private token: string;
  private state: State;

  // A promise that resolves to the lessons context for this user.
  private contextPromise: Promise<string>;

  // A buffer to store audio data received before the stream manager is ready.
  private buffer: ArrayBuffer[];

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
    this.contextPromise = callApi(this.token, 'context')
        .catch(this.close.bind(this));
  }

  private close(error) {
    console.error('Socket closed: ', error);
    // See https://tools.ietf.org/html/rfc6455#section-7.4.2
    const DEFAULT_WS_APPLICATION_ERROR_CODE = 4000;
    this.socket.close(DEFAULT_WS_APPLICATION_ERROR_CODE, error);
    this.recognizeStream.destroy();
    this.state = State.CLOSED;
  }

  // WebSocket handlers.

  private onSocketMessage(message) {
    if (message instanceof ArrayBuffer) {
      this.onSocketAudio(message);
    } else if (typeof message === 'string') {
      this.onSocketConfig(message);
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

    const { type, sampleRate } = config;

    if (type !== MessageType.CLIENT_SAMPLE_RATE || !sampleRate) {
      this.close('Invalid config message.');
      return;
    }

    if (this.state !== State.CONFIGURING_RECOGNIZE) {
      this.configureRecognizeStream(sampleRate);
    }
  }

  private onSocketAudio(audioData: ArrayBuffer) {
    if (this.state === State.READY) {
      this.recognizeStream.write(audioData);
    } else {
      this.buffer.push(audioData);
    }
  }

  private sendOnSocket(message: Object) {
    if (this.state === State.CLOSED) {
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  // Google Speech Recognition API handlers.

  private configureRecognizeStream(sampleRate) {
    this.state = State.CONFIGURING_RECOGNIZE;
    this.contextPromise.then((context) => {
      this.recognizeStream = createRecognizeStream(sampleRate, context);
      this.recognizeStream.on('data', this.onRecognizeData.bind(this));
      this.recognizeStream.on('error', console.error);

      // TODO: Remove server-side buffering once client does buffering.
      this.state = State.READY;

      // Flush the buffer.
      this.buffer.forEach(audioData => {
        this.recognizeStream.write(audioData);
      });
      this.buffer = [];

      this.sendOnSocket({ type: MessageType.SERVER_IS_READY });
    });
  }

  private onRecognizeData(data) {
    if (data.results) {
      for (const result of data.results) {
        if (result.isFinal) {
          this.onTranscriptReceived(result.transcript);
          break;
        }
      }
    }

    if (data.endpointerType === 'START_OF_SPEECH') {
      console.log('Speech start.');
    } else if (data.endpointerType === 'END_OF_AUDIO') {
      console.log('Speech end.');
      this.sendOnSocket({ type: 'SPEECH_END' });
    }
  }

  private onTranscriptReceived(transcript) => {
    console.log('Transcript received: ', transcript);
    this.sendOnSocket({ type: MessageType.SERVER_TRANSCRIPT, transcript });
    this.getAnswer(transcript).then((answer) => {
      this.sendOnSocket({ type: MessageType.SERVER_ANSWER, answer });
    });
  }

  private getAnswer(transcript) {
    return callApi(this.token, 'answers', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default StreamManager;
