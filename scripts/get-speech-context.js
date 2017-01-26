// Retrieves the speech context for an API.ai agent.

var fetch = require('isomorphic-fetch');
var keys = require('../keys/keys.json');
var throttle = require('lodash.throttle');
var mongoose = require('mongoose');
var mongooseTimestamp = require('mongoose-timestamp');
var Promise = require('promise');


const clientToken = keys.acornApiAiAgentAccessToken;
const developerToken = keys.acornApiAiAgentDeveloperAccessToken;

const isTest = false;


/////////////////////
// Formatting helpers
/////////////////////


function getId(item) {
  return item.id;
}

var ENTITY_REGEXP = /(^|[ ])@([^ ]+)/g;
function replaceEntityLabels(template, char) {
  return template.replace(ENTITY_REGEXP, char);
}

function flatten(nestedArray) {
  return [].concat.apply([], nestedArray);
}

function deduplicate(array) {
  var seen = {};
  return array.filter(function(item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

function removeNonWords(array) {
  const processed = array.map(function(item) {
    if (!item) return;
    return item.replace(/[.,\/?#!$%\^&\*;:{}=\-_`~()]/g,'').replace(/\s{2,}/g,'').trim();
  });
  return processed.filter(function(item) {
    return Boolean(item);
  });
}


/////////////////////
// Networking helpers
/////////////////////


var requestQueue = [];
var REQUEST_THROTTLE_MS = 350;  // 1000?

function fetchJson(url, options) {
  return fetch(url, options).then(response => {
    return response.json().then(json => {
      if (!response.ok) {
        throw Error(json);
      }
      return json;
    })
  });
}

var throttledFetch = throttle(function() {
  var request = requestQueue.shift();
  if (request) {
    fetchJson(request.url, request.options)
        .then(function(json) {
          request.callback(json);
        })
        .catch(function(e) {
          console.error(e);
        });
  }
  if (requestQueue.length) {
    throttledFetch();
  }
}, REQUEST_THROTTLE_MS);

function fetchFromApiAi(resource) {
  return new Promise(function(resolve, reject) {
    const url = 'https://api.api.ai/v1/' + resource + '?v=2015091';
    const options = {
      headers: { authorization: 'Bearer ' +  developerToken}
    };
    // NOTE: We cannot pass resolve directly. Must be evaluated within this function's scope.
    const callback = function(value) {
      resolve(value);
    };
    requestQueue.push({url: url, options: options, callback: callback});
    throttledFetch();
  });
}


/////////////
// Entrypoint
/////////////


function run() {

  // Use native Promises instead of mpromise, mongoose's default.
  mongoose.Promise = global.Promise;
  mongoose.connect('mongodb://127.0.0.1:27017/scout-db-local');
  // TODO: Write to mongoose instead of just console.logging.


  const schema = new mongoose.Schema({
    agentClientToken: String,
    phrases: [String],
  });
  schema.plugin(mongooseTimestamp);
  const model = mongoose.model('SpeechContext', schema);


  const entitiesPromise = fetchFromApiAi('entities');
  const intentsPromise = fetchFromApiAi('intents');


  Promise.all([entitiesPromise, intentsPromise]).then(function(values) {
    console.log('got values');
    const entities = values[0];
    const intents = values[1];

    const entityIds = entities.map(getId);
    const intentIds = intents.map(getId);

    const entityPromises = entityIds.map(function(id, i) {
      if (isTest && i !== 0) return Promise.resolve({});
      return fetchFromApiAi('entities/' + id);
    });

    const intentsPromises = intentIds.map(function(id, i) {
      if (isTest && i !== 0) return Promise.resolve({});
      return fetchFromApiAi('intents/' + id);
    });

    const entityPhrasesPromise = Promise.all(entityPromises).then(function(entities) {
      const nestedPhrases = entities.map(function(entity) {
        if (!entity.entries) return;
        const synonymsInArrays = entity.entries.map(function(entry) {
          let synonyms = entry.synonyms;
          if ((typeof synonyms) === 'string') {
            synonyms = [synonyms];
          }
          return synonyms;
        });
        return flatten(synonymsInArrays);
      });
      return flatten(nestedPhrases);
    });

    const intentPhrasesPromise = Promise.all(intentsPromises).then(function(intents) {
      const nestedPhrases = intents.map(function(intent) {
        if (!intent.templates) return;
        const templatesInParts = intent.templates.map(function(template) {
          return replaceEntityLabels(template, '@').split('@');
        });
        return flatten(templatesInParts);
      });
      return flatten(nestedPhrases);
    });

    const promises = Promise.all([intentPhrasesPromise, entityPhrasesPromise]);
    const phrasesPromise = promises
        .then(flatten)
        .then(deduplicate)
        .then(removeNonWords);

    phrasesPromise.then(function(phrases) {
      console.log(phrases);
    });
  });

}

function wait () {
   if (true) setTimeout(wait, 1000);
};
wait();

run();
