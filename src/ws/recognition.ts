import * as Speech from '@google-cloud/speech';

import settings from '../settings';

const speechClient = Speech({
  projectId: settings.projectId,
  credentials: settings.auth.serviceAccountCredentials
});

const STANDARD_OPTIONS = {
  encoding: 'LINEAR16',
  languageCode: 'en-us',
  profanityFilter: false,
};

export const createRecognizeStream = (sampleRate, context) => {
  const options: any = Object.assign({}, STANDARD_OPTIONS);
  options.sampleRate = sampleRate;
  options.speechContext = { phrases: context };
  console.log(`Creating stream with sample rate ${options.sampleRate}`);
  return speechClient.createRecognizeStream({
    config: options,
    verbose: true,
  });
};
