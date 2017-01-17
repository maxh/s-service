import { getDistance } from '../../infra/geo';
import { ITeacherSet } from '../interface';


const geo = {} as ITeacherSet;

geo.teachers = [
  {
    name: 'getDrivingDistance',
    description: 'How long will it take you to drive to a place?',
    exec: function(params) {
      const address = params.address;
      return new Promise(function(resolve, reject) {
        resolve(getDistance(params.user, address, 'driving'));
      });
    },
    params: {
      address: 'The address to which you\'re driving.',
    },
  },
  {
    name: 'getWalkingDistance',
    description: 'How long will it take you to walk to a place?',
    exec: function(params) {
      const address = params.address;
      return new Promise(function(resolve, reject) {
        resolve(getDistance(params.user, address, 'walking'));
      });
    },
    params: {
      address: 'The address to which you\'re walking.',
    },
  },
  {
    name: 'getCyclingDistance',
    description: 'How long will it take you to cycle to a place?',
    exec: function(params) {
      const address = params.address;
      return new Promise(function(resolve, reject) {
        resolve(getDistance(params.user, address, 'bicycling'));
      });
    },
    params: {
      address: 'The address to which you\'re cycling.',
    },
  },
];

geo.name = 'Geo';

export default geo;
