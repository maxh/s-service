import * as geocoder from 'geocoder';
import * as distance from 'google-distance';


export const getDistance = (user, address, mode) => {
  return new Promise(function(resolve, reject) {
    distance.get({
      origin: `${user.geo.coords.latitude},${user.geo.coords.longitude}`,
      destination: address,
      mode: mode,
      units: 'imperial'
    }, function(err, data) {
      if (err) {
        return reject(err);
      }

      let transport;
      if (mode === 'driving') {
        transport = 'drive';
      } else if (mode === 'walking') {
        transport = 'walk';
      } else if (mode === 'bicycling') {
        transport = 'cycle';
      }

      const sentence = `It'll take ${data.duration} to ${transport} ${data.distance}.`;

      resolve(sentence);
    });
  });
};

export const getLatLong = (address) => {
  return new Promise(function(resolve, reject) {
    geocoder.geocode(address, function(err, data ) {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.results[0].geometry.location);
    });
  });
};
