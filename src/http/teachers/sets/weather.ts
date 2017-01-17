import DarkSky from 'dark-sky';
import moment from 'moment-timezone';
import weatherLib from 'weather-js';

import { ITeacherSet } from '../interface';
import { getLatLong } from '../../infra/geo';
import settings from '../../../settings';

const forecast = new DarkSky(settings.auth.keys.dark_sky);

const mphToKnots = function(mph) {
  const MPH_TO_KNOTS = 0.868976241901;
  return Math.round(mph * MPH_TO_KNOTS);
}

const weather = {} as ITeacherSet;

weather.teachers = [
  {
    name: 'currentTemperature',
    description: 'What\'s the temperature in a specific city?',
    exec: function(params) {
      const city = params.city;
      return new Promise(function(resolve, reject) {
        weatherLib.find({ search: city, degreeType: 'F' }, function(err, result) {
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
        weatherLib.find({ search: city, degreeType: 'F' }, function(err, result) {
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
        weatherLib.find({ search: city, degreeType: 'F' }, function(err, result) {
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
        weatherLib.find({ search: city, degreeType: 'F' }, function(err, result) {
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
  {
    name: 'windSpeed',
    description: 'What\'s the current wind speed and direction at a particular place?',
    exec: function(params) {
      const location = params.location;
      return new Promise(function(resolve, reject) {
        getLatLong(location)
          .then(function(resp) {
            forecast.latitutde(resp.lat).longitude(resp.lng)
              .get()
              .then(function(resp) {
                let currentWind = `The wind is currently ${mphToKnots(resp.currently.windSpeed)} knots at ${Math.round(resp.currently.windBearing/10) * 10} degrees. `;
                if (resp.currently.windSpeed == 0) {
                  currentWind = "There is no wind currently. ";
                }

                const nextDay = resp.hourly.data.slice(0, 24);
                const windSpeeds = nextDay.map(function(data) {
                    return data.windSpeed;
                });

                let maxIdx = windSpeeds.indexOf(Math.max.apply(null, windSpeeds));
                let minIdx = windSpeeds.indexOf(Math.min.apply(null, windSpeeds));

                const max = resp.hourly.data[maxIdx];
                const min = resp.hourly.data[minIdx];

                const maxSentence = `the most wind will be ${mphToKnots(max.windSpeed)} knots at ${Math.round(max.windBearing/10) * 10} degrees at ${moment(max.time * 1000).format("h:mma on MMM D")}. `;
                const minSentence = `The least wind will be ${mphToKnots(min.windSpeed)} knots at ${Math.round(min.windBearing/10) * 10} degrees at ${moment(min.time * 1000).format("h:mma on MMM D")}. `;

                resolve(currentWind + "<br/><br/>In the next 24 hours, " + maxSentence + minSentence);
              })
          })
          .catch(function(err) {
            console.log(err);
            reject(err);
          })
        });
    },
    params: {
      location: 'The place to look up.',
    },
  },
];

weather.name = 'Weather';

export default weather;
