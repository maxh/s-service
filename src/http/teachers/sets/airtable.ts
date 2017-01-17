import AirtableApi from 'airtable';
import { ITeacherSet } from '../interface';


const airtable = {} as ITeacherSet;

airtable.teachers = [
  {
    name: 'findValueInRow',
    description: 'Finds a value in Airtable',

    exec: function(params) {
      // e.g. key5dQckObdab4khi, appau0ScyQyByJds0, Companies, Company name, foo, Valuation
      const apiKey = params.apiKey;
      const baseId = params.baseId;
      const baseName = params.baseName;   // 'Companies'
      const selectColName = params.selectColName;
      const selectColValue = params.selectColValue;
      const lookupColName = params.lookupColName;

      const base = new AirtableApi({ apiKey: apiKey }).base(baseId);

      return new Promise(function(resolve, reject) {
        base(baseName).select({
          // Selecting the first 3 records in Main View:
          maxRecords: 1,
          filterByFormula: `FIND('${selectColValue}', {${selectColName}})`
        }).eachPage(
          function page(records, fetchNextPage) {
            resolve(String(records[0].get(lookupColName)));
          },
          function done(error) {
            if (error) {
              console.log(error);
            }
          }
        );
      });
    },

    params: {
      apiKey: 'Your Airtable API key',
      baseId: 'The Airtable base ID',
      baseName: 'The Airtable base name',
      selectColName: 'Select the row based on this column (e.g. company_name)',
      selectColValue: 'The value of the column to select on (e.g. twitter)',
      lookupColName: 'The name of the column to retrieve (e.g. valuation)',
    },
  },
];

airtable.moduleName = 'Airtable';

export default airtable;
