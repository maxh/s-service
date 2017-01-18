import * as DarkSky from 'dark-sky';
import * as moment from 'moment-timezone';
import weatherLib from 'weather-js';

import settings from '../../../settings';
import { getLatLong } from '../../infra/geo';
import { ITeacherSet } from '../interface';

const forecast = new DarkSky(settings.auth.keys.dark_sky);

const mphToKnots = (mph) => {
  const MPH_TO_KNOTS = 0.868976241901;
  return Math.round(mph * MPH_TO_KNOTS);
};

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
      return getLatLong(location)
        .then(function(respLL: any) {
          forecast.latitude(respLL.lat).longitude(respLL.lng)
            .get()
            .then(function(resp: any) {
              let currentWind = `The wind is currently ${mphToKnots(resp.currently.windSpeed)}
                knots at ${Math.round(resp.currently.windBearing / 10) * 10} degrees. `;
              if (resp.currently.windSpeed === 0) {
                currentWind = `There is no wind currently. `;
              }

              const nextDay = resp.hourly.data.slice(0, 24);
              const windSpeeds = nextDay.map(function(data) {
                return data.windSpeed;
              });

              const maxIdx = windSpeeds.indexOf(Math.max.apply(null, windSpeeds));
              const minIdx = windSpeeds.indexOf(Math.min.apply(null, windSpeeds));

              const max = resp.hourly.data[maxIdx];
              const min = resp.hourly.data[minIdx];

              const maxWindSpeedKnots = mphToKnots(max.windSpeed);
              const minWindSpeedKnots = mphToKnots(min.windSpeed);

              const maxTime = moment(max.time * 1000).format('h:mma on MMM D');
              const minTime = moment(min.time * 1000).format('h:mma on MMM D');

              const maxWind = Math.round(max.windBearing / 10) * 10;
              const minWind = Math.round(min.windBearing / 10) * 10;

              const maxSentence = `the most wind will be ${maxWindSpeedKnots}\
                knots at ${maxWind} degrees at ${maxTime}.`;
              const minSentence = `The least wind will be ${minWindSpeedKnots}\
                knots at ${minWind} degrees at ${minTime}. `;

              const sentence = `${currentWind} <br/><br/>
                In the next 24 hours, ${maxSentence} ${minSentence}`;
              return sentence;
            });
        })
        .catch(function(err) {
          return err;
        });
    },
    params: {
      location: 'The place to look up.',
    },
  },
  {
    name: 'cloudCover',
    description: 'Is it cloudy today?',
    exec: function(params) {
      const location = params.location;
      getLatLong(location)
        .then(function(respLL: any) {
          forecast.latitude(respLL.lat).longitude(respLL.lng)
            .get()
            .then(function(resp: any) {
              const cloudPercentage = parseFloat(resp.currently.cloudCover) * 100;

              if (cloudPercentage === 0) {
                return `It's perfectly clear today. No clouds!`;
              } else if (cloudPercentage <= 10) {
                return `The sky's ${cloudPercentage}% clouds, so barely.`;
              } else if (cloudPercentage <= 30) {
                return `The sky's ${cloudPercentage}% clouds, so a bit.`;
              } else if (cloudPercentage <= 50) {
                return `The sky's ${cloudPercentage}% clouds, so a few.`;
              } else if (cloudPercentage <= 75) {
                return `The sky's ${cloudPercentage}% clouds, so quite!`;
              } else {
                return `The sky's ${cloudPercentage}% clouds, so very!`;
              }
            });
        })
        .catch(function(err) {
          return err;
        });
    },
    params: {
      location: 'The place to look up.',
    },
  },
  {
    name: 'sunset',
    description: 'When will the sun set today?',
    exec: function(params) {
      const location = params.location;
      getLatLong(location)
        .then(function(respLL: any) {
          forecast.latitude(respLL.lat).longitude(respLL.lng)
            .get()
            .then(function(resp: any) {
              const sunset = moment(resp.daily.data[0].sunsetTime * 1000)
                .tz(resp.timezone)
                .format('h:mma');
              return `The sun sets at ${sunset} this evening.`;
            });
        })
        .catch(function(err) {
          return err;
        });
    },
    params: {
      location: 'The place to look up.',
    },
  },
  {
    name: 'sunrise',
    description: 'When will the sun rise today?',
    exec: function(params) {
      const location = params.location;
      getLatLong(location)
        .then(function(respLL: any) {
          forecast.latitude(respLL.lat).longitude(respLL.lng)
            .get()
            .then(function(resp) {
              const sunrise = moment(resp.daily.data[0].sunriseTime * 1000)
                .tz(resp.timezone)
                .format('h:mma');
              return `The sun rose at ${sunrise} this morning.`;
            });
        })
        .catch(function(err) {
          return err;
        });
    },
    params: {
      location: 'The place to look up.',
    },
  },
  {
    name: 'howMuchPrecipitationThisWeek',
    description: 'How much precipitation will we get this week?',
    exec: function(params) {
      const location = params.location;
      getLatLong(location)
        .then(function(respLL: any) {
          forecast.latitude(respLL.lat).longitude(respLL.lng)
            .get()
            .then(function(resp: any) {
              let precipType = null;
              const weekPrecip = resp.daily.data.map(function(re) {
                  // DarkSky API may returns undefined. This is not well documented.
                if (re.precipProbability > 0 && typeof re.precipAccumulation !== 'undefined') {
                  precipType = re.precipType;
                  return re.precipAccumulation;
                }
                return 0;
              });

              const sum = weekPrecip.reduce(function(a, b) { return a + b; }, 0);
              return `${Math.round(sum)} inches of ${precipType} expected in the next week.`;
            });
        })
        .catch(function(err) {
          return err;
        });
    },
    params: {
      location: 'The place to look up.',
    },
  },
];

weather.name = 'Weather';

export default weather;
