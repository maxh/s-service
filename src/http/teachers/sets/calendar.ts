import gcal from 'google-calendar';
import moment from 'moment';
import Permissions from '../../models/Permissions';
import { ITeacherSet } from '../interface';


const calendar = {} as ITeacherSet;

const makeCalRequest = (user, startTime, endTime, calId = 'primary') => {
  return new Promise(function(resolve, reject) {
    Permissions.getGoogleTokenForUserId(user).then((gtoken) => {
      gcal(gtoken).events.list(
        calId, {
          orderBy: 'startTime',
          singleEvents: true,
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString()
        }, function(err, data) {
          if (err) return reject(err);
          return resolve(data);
        });
    });
  });
};

const formatEventString = (event) => {
  let start = null;
  let day = null;
  if (event && event.start) {
    start = moment(event.start.dateTime).format('hA');
    day = moment(event.start.dateTime).format('dddd');
  }

  let end = null;
  if (event.end) {
    end = moment(event.end.dateTime).format('hA');
  }

  let resp = `${event.summary}`;
  if (event.location) {
    resp += ' at ' + event.location;
  }

  if (start) {
    resp += ' from ' + start;

    if (end) {
      resp += ' to ' + end;
    }

    if (day) {
      resp += ' on ' + day;
    }
  }

  return resp;
};

calendar.teachers = [
  {
    name: 'getNextCalEvent',
    description: 'What and when is your next meeting?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const today = new Date();
        const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

        makeCalRequest(params.user, today, nextWeek)
          .then(function(data) {
            const event = data.items[0];

            if (!event) {
              resolve('We couldn\'t find a next event on your calendar.');
            }

            resolve(formatEventString(event));
          })
          .catch(function(error) {
            console.log(error);
            return reject(error);
          });
      });
   },
   params: {},
  },

  {
    name: 'getCalDay',
    description: 'What\'s on your calendar today?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        tomorrow.setHours(23, 59, 59, 99);

        makeCalRequest(params.user, today, tomorrow)
          .then(function(data) {
            if (data.items.length === 0) {
              return resolve('You have nothing on your calendar!');
            }

            const items = data.items.map(function(event) {
              return event.summary;
            });

            const sentence = items.slice(0, items.length - 1).join(', ') + ', and ' + items.slice(-1);
            resolve(sentence);
          })
          .catch(function(error) {
            return resolve(error);
          });
      });
    },
    params: {},
  },
  {
    name: 'getCalRestOfDay',
    description: 'What\'s happening the rest of today on your calendar?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const today = new Date();

        const laterToday = new Date();
        laterToday.setHours(23, 59, 59, 99);

        makeCalRequest(params.user, today, laterToday)
          .then(function(data) {
            if (data.items.length === 0) return resolve('You have nothing on your calendar!');

            const items = data.items.map(function(event) {
              const start = moment(event.start.dateTime).format('ha');
              return `${event.summary} at ${start}`;
            });

            const sentence = items.slice(0, items.length - 1).join(', ') + ', and ' + items.slice(-1);
            resolve(sentence);
          })
          .catch(function(error) {
            return reject(error);
          });
      });
    },
    params: {},
  },
  {
    name: 'getCalTomorrow',
    description: 'What\'s on your calendar tomorrow?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const today = new Date();
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const tomorrowEve = new Date(tomorrow);
        tomorrowEve.setHours(23, 59, 59, 99);

        makeCalRequest(params.user, tomorrow, tomorrowEve)
          .then(function(data) {
            if (data.items.length === 0) return resolve('You have nothing on your calendar!');

            const items = data.items.map(function(event) {
              const start = moment(event.start.dateTime).format('ha');
              return `${event.summary} at ${start}`;
            });

            const sentence = items.slice(0, items.length - 1).join(', ') + ', and ' + items.slice(-1);
            resolve(sentence);
          })
          .catch(function(error) {
            return reject(error);
          });
      });
    },
    params: {}
  },
  {
    name: 'howManyMeetingsTomorrow',
    description: 'How many meetings do you have tomorrow?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const today = new Date();
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const tomorrowEve = new Date(tomorrow);
        tomorrowEve.setHours(23, 59, 59, 99);

        makeCalRequest(params.user, tomorrow, tomorrowEve)
          .then(function(data) {
            const meetings = data.items.length === 1 ? 'meeting' : 'meetings';
            const sentence = `You have ${data.items.length} ${meetings} tomorrow.`;
            resolve(sentence);
          })
          .catch(function(error) {
            return reject (error);
          });
      });
    },
    params: {}
  },
  {
    name: 'howLongUntilNextEvent',
    description: 'How long are you free before your next meeting?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        makeCalRequest(params.user, now, next)
          .then(function(data) {
            if (!data.items || !data.items[0])
              resolve('I couldn\'t find a \'next meeting\' on your calendar.');

            const interval = moment(new Date()).to(data.items[0].start.dateTime, true);
            return resolve(interval);
          })
          .catch(function(error) {
            return reject(error);
          });
      });
    },
    params: {},
  },
  {
    name: 'findCoworker',
    description: 'Where\'s your co-worker? In a meeting?',
    exec: function(params) {
      const calId = params.calId;
      return new Promise(function(resolve, reject) {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        makeCalRequest(params.user, now, next, calId).then(function(data) {
          const event = data.items[0];
          if (event && moment(new Date()).isBetween(event.start.dateTime, event.end.dateTime)) {
            resolve(formatEventString(event));
          }
          resolve('I checked the calendar, and there\'s nothing scheduled right now.');
        })
        .catch(function(error) {
          console.log(error);
          return reject(error);
        });
      });
    },
    params: {
      calId: 'The email of the co-worker you\'re looking up',
    },
  },
  {
    name: 'findSpecificMeeting',
    description: 'Look up when a specific meeting will happen',
    exec: function(params) {
      const query = params.query;
      const calId = 'primary';

      return new Promise(function(resolve, reject) {
        const now = new Date();
        const next = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        makeCalRequest(params.user, now, next, calId).then(function(data) {
          const matches = data.items.filter(function(event) {
            return event.summary.indexOf(query) != -1;
          });

          const events = matches.map(function(event) {
            return `${event.summary} from ${moment(event.start.dateTime).format('hA')} to ${moment(event.end.dateTime).format('hA')} on ${moment(event.end.dateTime).format('MMM Do')}`;
          });

          resolve(events.join('; '));
        }).catch(function(error){
          reject(error);
        });
      });
    },
    params: {
      query: 'The meeting name to search for',
    },
  },
  {
    name: 'findFreeTime',
    exec: function(params) {
      const calId = 'primary';

      // this doesn't support minutes – only full-hour times.
      const range = params.range.split(',');
      const startRange = range[0].trim();
      const stopRange = range[1].trim();

      return new Promise(function(resolve, reject) {
        // currently looks a month out. this doesn't have to be hardcoded, ofc
        const now = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);
        const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        makeCalRequest(params.user, now, next, calId).then(function(data) {

          const days = [];
          let curr = moment(now).hour(startRange).minutes(0);
          while (next > curr) {
            days.push(curr.clone());
            curr = curr.add(1, 'days');
          }

          const matches = days.filter(function(day) {
            // removes weekends
            return day.isoWeekday() < 6;
          }).map(function(day) {
            return day.format('MMM Do');
          });

          data.items.map(function(event) {
            const eventStart = moment(event.start.dateTime);
            const eventEnd = moment(event.end.dateTime);

            const windowStart = moment(now).hour(startRange);
            const windowEnd = moment(now).hour(stopRange);

            // if the event starts or ends in between the given window, splice it out
            if ( (eventStart.hours() > windowStart.hours() && eventStart.hours() < windowEnd.hours() ) ||
                ( eventEnd.hours() > windowStart.hours() && eventEnd.hours() < windowEnd.hours() )) {
              const index = matches.indexOf(eventStart.format('MMM Do'));
              matches.splice(index, 1);
            }
          });

          resolve(matches.join(', '));
        }).catch(function(error){
          reject(error);
        });
      });
    },
    description: 'Find the next block of free time on your calendar in a specific time range – say 8-10a',
    params: {
      range: 'Comma-separated times. Use 24h time, e.g. '17,19' for 5-7p.'
    },
  },
];

calendar.moduleName = 'Calendar';
calendar.permissions = {
  google: ['https://www.googleapis.com/auth/calendar'],
};

export default calendar;
