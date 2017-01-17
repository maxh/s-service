import googleDrive from 'google-drive';

import { ITeacherSet } from '../interface';

import Permission from '../../models/Permission';


const fetchItems = (userId, options): Promise<any[]> => {
  return Permission.getGoogleTokenForUserId(userId).then((gtoken) => {
    return new Promise(function(resolve, reject) {
      googleDrive(gtoken).files().list(options, (err, response, body) => {
        if (err) {
          reject(err);
          return;
        }
        body = JSON.parse(body);
        if (body.error) {
          reject(body.error);
          return;
        }
        resolve(body.items);
      });
    });
  });
};

const buildHtml = (item) => {
  const html = (
      `<img height="18" src="${item.iconLink}" style="padding-right: 6px;">` +
      `<a href="${item.alternateLink}" target="_blank">${item.title}</a>`
  );
  return html;
};

const buildSharedHtml = (item) => {
  return (
      `<li><img height="16" src="${item.iconLink}" style="padding-right: 6px;">` +
      `<a href="${item.alternateLink}" target="_blank">${item.title}</a> ` +
      `from ${item.ownerNames[0]}</li>`
  );
};

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const buildSharedListHtml = (items) => {
  const list = items.map(buildSharedHtml);
  return `<ul>${list.join('')}</ul>`;
};

const gdrive = {} as ITeacherSet;

gdrive.teachers = [
  {
    name: 'mostRecentEditedFile',
    exec: function(params) {
      const options = {
        maxResults: 1,
        orderBy: 'modifiedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'It doesn\'t look like you edited a file recently.';
        }
        return buildHtml(items[0]);
      });
    },
    description: 'Open the file you edited most recently.',
    params: {},
  },
  {
    name: 'mostRecentViewedFile',
    exec: function(params) {
      const options = {
        maxResults: 1,
        orderBy: 'modifiedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'It doesn\'t look like you\'ve viewed a file recently.';
        }
        return buildHtml(items[0]);
      });
    },
    description: 'Open the file you viewed most recently.',
    params: {},
  },
  {
    name: 'mostRecentlySharedFile',
    exec: function(params) {
      const options = {
        maxResults: 1,
        orderBy: 'modifiedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'It doesn\'t look like you\'ve been shared a file recently.';
        }
        return buildHtml(items[0]);
      });
    },
    description: 'Open the file you were most recently shared.',
    params: {},
  },
  {
    name: 'sharedButNotYetSeenFiles',
    exec: function(params) {
      const options = {
        maxResults: 100,
        orderBy: 'sharedWithMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'It doesn\'t look like you\'ve been shared a file you haven\'t yet seen.';
        }
        const filtered = items.filter(function(a){
          return !a.hasOwnProperty('lastViewedByMeDate') && !a.hasOwnProperty('modifiedByMeDate');
        });
        if (filtered.length === 0) {
          return 'You\'ve seen all the files that have been shared with you.';
        }
        return buildSharedListHtml(filtered);
      });
    },
    description: 'Open the files that you have been shared but have not yet seen.',
    params: {},
  },
  {
    name: 'findFileByName',
    exec: function(params) {
      const options = {
        corpus: 'DEFAULT',
        q: `title contains '${params.filename}'`,
        maxResults: 100,
        orderBy: 'lastViewedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'I couldn\'t find a file by that name.';
        }
        return buildSharedListHtml(items);
      });
    },
    description: 'Find files by a specific filename',
    params: { filename: 'The file name to search for' },
  },
  {
    name: 'findFileByOwner',
    exec: function(params) {
      const options = {
        corpus: 'DEFAULT',
        q: `'${params.owner}' in owners and mimeType != '${FOLDER_MIME_TYPE}'`,
        maxResults: 100,
        orderBy: 'lastViewedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'I couldn\'t find any files by that person.';
        }
        return buildSharedListHtml(items);
      });
    },
    description: 'Find files created by a particular person',
    params: { owner: 'The owner to search for' },
  },
  {
    name: 'openFolderByName',
    exec: function(params) {
      const options = {
        corpus: 'DEFAULT',
        q: `title contains '${params.folderName}' and mimeType = '${FOLDER_MIME_TYPE}'`,
        maxResults: 100,
        orderBy: 'lastViewedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'I couldn\'t find that folder.';
        }
        return buildSharedListHtml(items);
      });
    },
    description: 'Open a specific folder',
    params: { folderName: 'The name of the folder to open' },
  },
  {
    name: 'showAllFolders',
    exec: function(params) {
      const options = {
        corpus: 'DEFAULT',
        q: `mimeType = '${FOLDER_MIME_TYPE}'`,
        maxResults: 100,
        orderBy: 'lastViewedByMeDate desc'
      };
      return fetchItems(params.userId, options).then((items) => {
        if (!items || items.length === 0) {
          return 'I couldn\'t find any folders.';
        }
        return buildSharedListHtml(items);
      });
    },
    description: 'Show all the folders in your Google Drive',
    params: {},
  },
];

gdrive.name = 'Google Drive';
gdrive.permissions = {
  google: ['https://www.googleapis.com/auth/drive.readonly'],
};

export default gdrive;
