var repl = require('repl');
var fs = require('fs');

var readFile = function(path) {
  return JSON.parse(fs.readFileSync(path).toString())
};
var keys = readFile('./keys/keys.json');
var QueryManager = require('../build/ws/QueryManager').default;
var maxATloftboxlabs = '5887fb632ad5f634cb037d88';
var userId = maxATloftboxlabs;
var qm = new QueryManager(keys.acornApiAiAgentAccessToken, userId);

var replServer = repl.start({
  prompt: 'query-repl > ',
});

replServer.context.getAnswer = function(transcript) {
  var log = console.log.bind(console);
  qm.getAnswer(transcript).then(log).catch(log);
};
