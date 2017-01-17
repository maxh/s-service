import bitcoinity from 'bitcoinity';
import { ITeacherSet } from '../interface';


const bitcoin = {} as ITeacherSet;

bitcoin.teachers = [
  {
    name: 'BTCExchangeVolume',
    description: 'Check a certain exchange\'s share of total volume, per data.bitcoinity.com',

    exec: function(params) {
      const name = params.name.toLowerCase();

      return new Promise(function(resolve, reject) {
        bitcoinity.getCSV({
          data_type: 'rank',
          timespan: '24h',
          volume_unit: 'usd',
          t: 'ae',
          c: 'e'
        }, function(err, csvData) {
          if (err) {
            reject(err);
          }

          const wideData = bitcoinity.parseCSV(csvData);
          const row = wideData.rows[wideData.rows.length - 1];

          const sum = Object.keys(row).reduce(function(sumInner, key) {
            if (key === 'Time') {
              return sumInner;
            }
            return sumInner + parseFloat(row[key]);
          }, 0);

          const exchange = wideData.rows[wideData.rows.length - 1][name];
          const share = `${Math.round(exchange / sum * 100 * 100) / 100}%`;

          resolve(share);
        });
      });
    },

    params: {
      answer: 'The exchange to look up',
    },
  },
];

bitcoin.moduleName = 'Bitcoin';

export default bitcoin;
