import weather from 'weather-js';
import { ITeacherSet } from '../interface';


const weather = {} as ITeacherSet;

weather.teachers = [
  {
    name: 'currentTemperature',
    description: 'What\'s the temperature in a specific city?',
    exec: function(params) {
      const city = params.city;
      return new Promise(function(resolve, reject) {
        weather.find({ search: city, degreeType: 'F' }, function(err, result) {
          if (err) {
            return reject(err);
          }

          resolve(`${result[0].current.temperature} degrees.`);
        });
      });
    },
    params: {
      city: 'The city to look up.',
    },
  },
  {
    name: 'currentWeather',
    description: 'What\'s the weather in a specific city?',
    exec: function(params) {
      const city = params.city;
      return new Promise(function(resolve, reject) {
        weather.find({ search: city, degreeType: 'F' }, function(err, result) {
          if (err) {
            return reject(err);
          }

          let sentence = `${result[0].current.temperature} degrees and` +
              `${result[0].current.skytext.toLowerCase()}.`;

          if (result[0].current.temperature !== result[0].current.feelslike) {
            sentence += ` It feels like it's ${result[0].current.feelslike} degrees.`;
          }

          resolve(sentence);
        });
      });
    },
    params: {
      city: 'The city to look up.',
    },
  },
  {
    name: 'tomorrowWeather',
    description: 'What\'ll the weather be tomorrow in a specific city?',
    exec: function(params) {
      const city = params.city;
      return new Promise(function(resolve, reject) {
        weather.find({ search: city, degreeType: 'F' }, function(err, result) {
          if (err) {
            return reject(err);
          }

          const { low, high, precip } = result[0].forecast[1];
          const answer = `Low of ${low} degrees and a high of ${high} degrees.` +
                         `${precip} percent chance of rain.`;

          resolve(answer);
        });
      });
    },
    params: {
      city: 'The city to look up.',
    },
  },
  {
    name: 'rainChance',
    description: 'What\'s the chance of rain in a specific city?',
    exec: function(params) {
      const city = params.city;
      return new Promise(function(resolve, reject) {
        weather.find({ search: city, degreeType: 'F' }, function(err, result) {
          if (err) {
            return reject(err);
          }

          let judgement;
          if (Number(result[0].forecast[1].precip) > 95) {
            judgement = 'Yep.';
          } else if (Number(result[0].forecast[1].precip) > 75) {
            judgement = 'Most likely.';
          } else if (Number(result[0].forecast[1].precip) < 5) {
            judgement = 'Nope.';
          } else if (Number(result[0].forecast[1].precip) < 20) {
            judgement = 'Probably not.';
          } else {
            judgement = 'Maybe.';
          }

          resolve(`${judgement} There's a ${result[0].forecast[1].precip} percent chance of rain.`);
        });
      });
    },
    params: {
      city: 'The city to look up.',
    },
  },
];

weather.moduleName = 'Weather';

export default weather;
