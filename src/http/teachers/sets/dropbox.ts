import DropboxSDK from 'dropbox';

import Permission, { Provider } from '../../../models/Permission';
import { ITeacherSet } from '../interface';


const dropbox = {} as ITeacherSet;

const getAuthorizedDropboxSdk = (userId) => {
  return Permission.find(userId, Provider.DROPBOX).then((permission) => {
    return new DropboxSDK({ accessToken: permission.providerInfo.accessToken });
  });
};

const fetchFiles = (userId, path = '') => {
  return getAuthorizedDropboxSdk(userId).then((dbx) => {
    // for the root folder, you pass an empty string. for subfolders, you need a preceeding slash.
    if (path.length > 0) {
      path = `/${path}`;
    }
    return dbx.filesListFolder({ path: path, recursive: false })
        .then(response => response.entries);
  });
};

const findFile = (userId, path = '', query = '') => {
  return getAuthorizedDropboxSdk(userId).then((dbx) => {
    return dbx.filesSearch({ path, query });
  });
};

const getLink = (userId, path = '') => {
  return getAuthorizedDropboxSdk(userId).then((dbx) => {
    return dbx.sharingGetSharedLinks({ path }).then((response) => {
      if (response.links.length > 0) {
        return response.links[0];
      } else {
        return dbx.sharingCreateSharedLink({ path });
      }
    });
  });
};

dropbox.teachers = [
  {
    name: 'displayFilesInFolder',
    description: 'See all the files you have in a particular folder.',
    exec: function(params) {
      const { userId, path } = params;
      return fetchFiles(userId, path).then((files) => {
        const displayPromises = files.map((file) => {
          if (file['.tag'] === 'file') {
            return getLink({ user: params.user, path: file.path_lower }).then(link => {
              return `<li><a href="${link.url}">${link.path}</a></li>`;
            });
          }
          if (file['.tag'] === 'folder') {
            return Permission.find(userId, Provider.DROPBOX).then((permission) => {
              // This URL pattern isn't officially but appears to work on work / personal accounts.
              // TODO(max): Understand from Erik how this fits into the MongoDB Permission schema.
              const accountType = 'teamId' in permission.providerInfo ? 'work' : 'personal';
              const encodedPath = encodeURIComponent(file.path_lower);
              const url = `https://dropbox.com/${accountType}${encodedPath}`;
              return `<li><a href="${url}" target="_blank">${file.path_display}</a> folder</li>`;
            });
          }
        });
        return Promise.all(displayPromises).then(results => `<ul>${results.join('')}</ul>`);
      });
    },
    params: {
      path: (
          'The folder in which you\'d like to begin your search. ' +
          '(Leave this blank to start at the top level.)'
      ),
    },
  },
  {
    name: 'openfileByName',
    description: 'Open a particular file by name.',
    exec: function(params) {
      const { userId, path, query } = params;
      return findFile(userId, path, query).then(function(response) {
        const displayPath = response.matches[0].metadata.path_display;
        return getLink(userId, displayPath).then((link) => {
          return `<a href='${link.url}'>${link.path}</a>`;
        });
      });
    },
    params: {
      path: (
          'The folder in which you\'d like to begin your search. ' +
          '(Leave this blank to start at the top level.)'
      ),
      query: 'The name of the file you\'d like to open.',
    },
  },
];

dropbox.name = 'Dropbox';
dropbox.requiredPermissions = [{
  provider: Provider.DROPBOX,
}];

export default dropbox;
