import stocks from 'google-stocks';
import * as fetch from 'isomorphic-fetch';
import { ITeacherSet } from '../interface';


const finance = {} as ITeacherSet;

finance.teachers = [
  {
    name: 'stockPrice',
    description: 'What\'s the stock price of a specific company?',
    exec: function(params) {
      const ticker = params.ticker;
      return new Promise(function(resolve, reject) {
        stocks([ticker], function(err, result) {
          if (err) {
            return reject(err);
          }
          resolve(`$${result[0].l}`);
        });
      });
    },
    params: {
      ticker: 'The ticker symbol for the company you\'re tracking.',
    },
  },
  {
    name: 'marketCap',
    description: 'What\'s the market cap of a specific company?',
    exec: function(params) {
      const ticker = params.ticker;
      const url = 'http://download.finance.yahoo.com/d/quotes.csv?s=' + ticker + '&f=j1';
      return fetch(url).then(response => {
        return response.text().then((body) => {
          return `$${body.replace(/(\r\n|\n|\r)/gm,'')}`;
        });
      });
    },
    params: {
      ticker: 'The ticker symbol for the company you\'re tracking.',
    },
  },
];

finance.moduleName = 'Finance';

export default finance;
