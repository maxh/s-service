import chrono from 'chrono-node';
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import timezoner from 'timezoner';

import { getLatLong } from '../../infra/geo';

import settings from '../../../settings';
import { ITeacherSet } from '../interface';


const datetime = {} as ITeacherSet;

datetime.teachers = [
  {
    name: 'timeUntilDate',
    description: 'How long until a specific date?',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const date = new Date();
        const futureDate = new Date(chrono.parseDate(params.futureDate));
        const diff = moment(futureDate).toNow(true);
        resolve(diff);
      });
    },
    params: {
      futureDate: 'The date you\'re anticipating.',
    },
  },
  {
    name: 'getTimeInCity',
    description: 'Look up what time it is in a specific city.',
    exec: function(params) {
      const city = params.city;
      return getLatLong(city).then(function(data) {
        timezoner.getTimeZone(data.lat, data.lng, function(err, result) {
          if (err) {
            throw err;
          }
          const localTime = momentTimezone(new Date(), params.user.geo.timezone.id)
              .tz(result.timeZoneId)
              .format('h:mm a');
          return localTime;
        }, {
          key: settings.auth.keys.gmaps
        });
      });
    },
    params: {
      city: 'The city you\'re checking in on.',
    },
  },
];

datetime.moduleName = 'Dates and times';

export default datetime;
