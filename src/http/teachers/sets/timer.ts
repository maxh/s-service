import { ITeacherSet } from '../interface';


const timer = {} as ITeacherSet;

timer.teachers = [
  {
    name: 'setTimer',
    exec: function(params) {
      // Client must handler setting the actual timer.
      return new Promise(function(resolve, reject) {
        resolve('Timer set for ' + params.time + '.');
      });
    },
    description: 'Sets a timer',
    params: { time: 'The amount of time' },
  },
];

timer.moduleName = 'Timer';

export default timer;
