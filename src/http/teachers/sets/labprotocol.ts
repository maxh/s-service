import { ITeacherSet, IHtmlRequest } from '../interface';

import { getScoutGoogleAccessToken } from '../../../infra/google-auth';


// tslint:disable:next-line no-var-requires
const PROTOCOLS = require(process.cwd() + '/data/labProtocols.json');

// data:application/pdf;base64,YOURBASE64DATAHERE

const getHtmlRequestForDocId = (docId): Promise<IHtmlRequest> => {
  return getScoutGoogleAccessToken().then(token => {
    return {
      url: `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/html`,
      options: {
        headers: { authorization: 'Bearer ' + token },
      }
    };
  });
};

const getDocIdFromUrl = (url) => {
  const regexp = /\/d\/([^\/]*)\//g;
  const matches = regexp.exec(url);
  return matches[1];
};


const labprotocols = {} as ITeacherSet;

labprotocols.teachers = [
  {
    name: 'showLabProtocol',
    description: 'Shows a lab protocol on the screen.',
    exec: function(params) {
      const url = PROTOCOLS[params.protocolId].link;
      const isGoogleDocs = url.indexOf('docs.google.com') !== -1;
      if (isGoogleDocs) {
        const docId = getDocIdFromUrl(url);
        return getHtmlRequestForDocId(docId).then(htmlRequest => ({ htmlRequest }));
      } else {
        return Promise.resolve({
          link: url,
          display: params.protocolId
        });
      }
    },
    params: {
      protocolId: 'The ID of the protocol you want to see.',
    },
  }
];

labprotocols.name = 'Lab Protocols';

export default labprotocols;
