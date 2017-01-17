import * as fs from 'fs';


export interface ISettings {
  projectId: string;
  port: number;
  webServerUrl: string;
  socketServerUrl: string;
  auth: {
    jwtExpiresInSeconds: number;
    keys: any;
    serviceAccountCredentials: any;
  };
  mongo: {
    dbName: string;
    url: string;
  };
}

const CREDS_ENV_VAR = process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_JSON;
const KEY_PATH = './keys/scout-service-account-credentials.json';
const LOCAL_MONGO = 'mongodb://127.0.0.1:27017';
const PROD_MONGO =
    'mongodb://scoutdb-user:IsBx3ASt2Bsv@ds155718.mlab.com:55718';

const readFile = (path) => JSON.parse(fs.readFileSync(path).toString());

const settings: any = {};

settings.mongo = {};
settings.auth = {};

settings.projectId = 'scout-loftboxlabs';
settings.auth.jwtExpiresInSeconds = 60 * 60 * 5;

const setProd = () => {
  settings.port = process.env.PORT;
  settings.webServerUrl = 'https://' + process.env.HOSTNAME;
  settings.socketServerUrl = 'wss://' + process.env.HOSTNAME;
  settings.mongo.dbName = 'scout-db-prod';
  settings.mongo.url = PROD_MONGO + '/' + settings.mongoDbName;
  settings.auth.keys = JSON.parse(process.env.AUTH_KEYS);
  settings.auth.serviceAccountCredentials = JSON.parse(CREDS_ENV_VAR);
};

const setDev = () => {
  settings.port = 5000;
  settings.webServerUrl = 'https://localhost:' + settings.port;
  settings.socketServerUrl = 'wss://localhost:' + settings.port;
  settings.mongo.dbName = 'scout-db-local';
  settings.mongo.url = LOCAL_MONGO + '/' + settings.mongo.dbName;
  settings.auth.keys = readFile('./keys/keys.json');
  settings.auth.serviceAccountCredentials = readFile(KEY_PATH);
};

if (process.env.NODE_ENV === 'production') {
  setProd();
} else {
  setDev();
}

export default settings as ISettings;
