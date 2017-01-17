import { ITeacherSet } from '../interface';


const basic = {} as ITeacherSet;

basic.teachers = [
  {
    name: 'constantReply',
    description: 'Very simple: just responds with the response you want',

    exec: function(params) {
      return new Promise(function(resolve, reject) {
        resolve(params.answer);
      });
    },

    params: {
      answer: 'The response you want',
    },
  },
  {
    name: 'randomReply',
    description: 'Chooses one of the responses at random and replies with it',

    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const potentials = [];

        Object.keys(params).map(function(key, index) {
          // kinda hacky, there's also a params.user I don't want to include
          if (key.indexOf('poss') !== -1 && params[key] !== null) {
            potentials.push(params[key]);
          }
        });

        const answer = potentials[Math.floor(Math.random() * potentials.length)];
        resolve(answer);
      });
    },

    params: {
      possibility1: 'A possible response',
      possibility2: 'A possible response',
      possibility3: 'A possible response',
      possibility4: 'A possible response',
      possibility5: 'A possible response',
    },
  },
];

Basic.moduleName = 'Basic';

export default Basic;
