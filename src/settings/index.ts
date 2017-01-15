import * as fs from 'fs';


const settings: any = {};

const KEY_PATH = './keys/scout-service-account-credentials.json';

const readFile = (path) => JSON.parse(fs.readFileSync(path).toString());

const PROD_MONGO_BASE =
    'mongodb://scoutdb-user:IsBx3ASt2Bsv@ds155718.mlab.com:55718';

settings.projectId = 'scout-loftboxlabs';

if (process.env.NODE_ENV === 'production') {
  settings.port = process.env.PORT;
  settings.mongoDbName = 'scout-db-prod';
  settings.urls = {
    binaryServer: 'wss://' + process.env.HOSTNAME,
    mainServer: 'https://' + process.env.HOSTNAME,
    mongo: PROD_MONGO_BASE + '/' + settings.mongoDbName,
  };
  settings.auth = {
    keys: JSON.parse(process.env.AUTH_KEYS),
    serviceAccountCredentials: JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_JSON),
  };
} else {
  settings.port = 5000;
  settings.mongoDbName = 'scout-db-local';
  settings.urls = {
    binaryServer: 'ws://localhost:' + settings.port,
    mainServer: 'http://localhost:' + settings.port,
    mongo: 'mongodb://127.0.0.1:27017' + '/' + settings.mongoDbName,
  };
  settings.auth = {
    keys: readFile('./keys/keys.json'),
    serviceAccountCredentials: readFile(KEY_PATH),
  };
}

export default settings;
