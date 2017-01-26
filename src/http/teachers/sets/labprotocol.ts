import { ITeacherSet } from '../interface';

// tslint:disable:next-line no-var-requires
const PROTOCOLS = require(process.cwd() + '/data/labProtocols.json');


const labprotocols = {} as ITeacherSet;

labprotocols.teachers = [
  {
    name: 'showLabProtocol',
    description: 'Shows a lab protocol on the screen.',
    exec: function(params) {
      const url = PROTOCOLS[params.protocolId].link;
      const html = `<a href="${url}">${url}</a>`;
      return Promise.resolve(html);
    },
    params: {
      protocolId: 'The ID of the protocol you want to see.',
    },
  }
];

labprotocols.name = 'Lab Protocols';

export default labprotocols;
