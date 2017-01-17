import * as fs from 'fs';

import { ITeacherSet } from '../interface';


const PERIODIC_TABLE_PATH = '../data/periodicTable.json';

const chemistry = {} as ITeacherSet;

/* tslint:disable */
const FIELDS = ['name','appearance','atomic_mass','boil','category','color','density','discovered_by','melt','molar_heat','named_by','number','period','phase','source','spectral_img','summary','symbol','xpos','ypos'];
/* tslint:enable */

let cachedPeriodicTable = null;

const loadPeriodicTable = () => {
  return new Promise((resolve, reject) => {
    if (cachedPeriodicTable) {
      resolve(cachedPeriodicTable);
      return;
    }
    fs.readFile(PERIODIC_TABLE_PATH, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      cachedPeriodicTable = data;
      resolve(data);
    });
  });
};

const fetchInfo = (field, params) => {
  return loadPeriodicTable().then((periodicTable: any) => {
    if (FIELDS.indexOf(field) < 0) {
      return 'I don\'t have information on that field.';
    }

    const element = periodicTable.elements.filter(function(el) {
      return el.name.toLowerCase() === params.element.toLowerCase();
    })[0];

    if (!element) {
      return 'I couldn\'t find that element';
    }

    return element[field];
  });
};

chemistry.teachers = [
  {
    name: 'appearance',
    exec: function(params) {
      return fetchInfo('appearance', params);
    },
    description: 'Looks up the element\'s appearance.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'atomic_mass',
    exec: function(params) {
      return fetchInfo('atomic_mass', params);
    },
    description: 'Looks up the element\'s atomic mass.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'boil',
    exec: function(params) {
      return fetchInfo('boil', params);
    },
    description: 'Looks up the element\'s boiling point.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'category',
    exec: function(params) {
      return fetchInfo('category', params);
    },
    description: 'Looks up the element\'s category.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'color',
    exec: function(params) {
      return fetchInfo('color', params);
    },
    description: 'Looks up the element\'s color.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'density',
    exec: function(params) {
      return fetchInfo('density', params);
    },
    description: 'Looks up the element\'s density.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'discovered_by',
    exec: function(params) {
      return fetchInfo('discovered_by', params);
    },
    description: 'Looks up the element\'s discoverer.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'melt',
    exec: function(params) {
      return fetchInfo('melt', params);
    },
    description: 'Looks up the element\'s melting point.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'molar_heat',
    exec: function(params) {
      return fetchInfo('molar_heat', params);
    },
    description: 'Looks up the element\'s heat capacity.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'named_by',
    exec: function(params) {
      return fetchInfo('named_by', params);
    },
    description: 'Looks up the name of the person who named the element.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'number',
    exec: function(params) {
      return fetchInfo('number', params);
    },
    description: 'Looks up the element\'s number in the periodic table.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'period',
    exec: function(params) {
      return fetchInfo('period', params);
    },
    description: 'Looks up the element\'s period.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'phase',
    exec: function(params) {
      return fetchInfo('phase', params);
    },
    description: 'Looks up the element\'s phase.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'summary',
    exec: function(params) {
      return fetchInfo('summary', params);
    },
    description: 'Looks up the element\'s summary.',
    params: { element: 'Which element to look up' },
  },
  {
    name: 'symbol',
    exec: function(params) {
      return fetchInfo('symbol', params);
    },
    description: 'Looks up the element\'s symbol.',
    params: { element: 'Which element to look up' },
  },
];

chemistry.name = 'Chemistry';

export default chemistry;
