import * as moment from 'moment';
import Gmail from 'node-gmail-api';

import Permission from '../../models/Permission';
import { ITeacherSet } from '../interface';

const SEARCH_URL_BASE = 'https://mail.google.com/mail/#search/rfc822msgid:';

const buildSearchUrl = (messageId) => {
  return SEARCH_URL_BASE + encodeURIComponent(messageId);
};

const fetchEmails = (user, query, max = 100): Promise<any[]> => {
  return new Promise(function(resolve, reject) {
    Permission.getGoogleTokenForUserId(user).then((gtoken) => {
      const gmail = new Gmail(gtoken);
      const s = gmail.messages(query, { max: max }, { fields: ['snippet'] });

      const resp = [];

      s.on('data', function(d) {
        resp.push(d.snippet);
      });

      s.on('end', function() {
        resolve(resp);
      });
    });
  });
};

const buildMailListItem = function(headers) {
  const message = headers.filter(function(entry) {
    return (entry.name === 'From' ||
            entry.name === 'Subject' ||
            entry.name === 'Message-ID');
  });

  const obj: any = {};
  message.map(function(entry) {
    obj[entry.name.replace('-', '')] = entry.value;
  });

  const url = buildSearchUrl(obj.MessageID);
  return (
      `<li>Message from ${obj.From}: ` +
      `'<a href="${url}" target="_blank">${obj.Subject}</a>'</li>`
  );
};

const email = {} as ITeacherSet;

email.teachers = [
  {
    name: 'unreadEmails',
    description: 'Do you have any unread emails?',
    exec: function(params) {
      return fetchEmails(params.user, 'in:inbox is:unread').then(function(resp) {
        if (resp.length === 0) {
          return 'You don\'t have any unread email in your inbox.';
        }

        let label = 'emails';
        if (resp.length === 1) {
          label = 'email';
        }

        return `You have ${resp.length} unread ${label} in your inbox.`;
      });
    },
    params: {
    },
  },
  {
    name: 'sayUnreadEmails',
    description: 'We\'ll read you the subject and sender from your unread emails',
    exec: function(params) {
      return Permission.getGoogleTokenForUserId(params.userId).then((gtoken) => {
        const gmail = new Gmail(gtoken);
        const s = gmail.messages('in:inbox is:unread', { max: 100 }, { fields: ['payload'] });
        const resp = [];

        s.on('data', function(d) {
          resp.push(d.payload.headers);
        });

        s.on('end', function() {
          const listItems = resp.map(buildMailListItem);
          if (listItems.length === 0) {
            return 'No unread emails.';
          }

          return `<ul>${listItems}</ul>`;
        });
      });
    },
    params: {},
  },
  {
    name: 'unreadEmailsFromToday',
    description: 'Do you have any unread emails from today?',
    exec: function(params) {
      const today = moment().format('Y/M/D');
      const tomorrow = moment().add(1, 'days').format('Y/M/D');

      const query = `label:inbox is:unread after:${today} before:${tomorrow}`;
      return fetchEmails(params.user, query).then(function(resp) {
        if (resp.length === 0) {
          return 'You don\'t have any unread email from today.';
        }

        let label = 'emails';
        if (resp.length === 1) {
          label = 'email';
        }
        return `You have ${resp.length} unread ${label} in your inbox from today.`;
      });
    },
    params: {},
  },
  {
    name: 'unreadEmailsFromSomeone',
    description: 'Do you have any unread emails from someone in particular?',
    exec: function(params) {
      const sender = params.sender;

      if (typeof(sender) === 'undefined') {
        return Promise.reject('You need to tell me who the important sender is!');
      }

      return fetchEmails(params.user, `label:inbox is:unread from:${sender}`).then(function(resp) {
        if (resp.length === 0) {
          return `You don't have any unread email from ${sender}.`;
        }

        let label = 'emails';
        if (resp.length === 1) {
          label = 'email';
        }
        return `You have ${resp.length} unread ${label} from ${sender}.`;
      });
    },
    params: {
      sender: 'The email address of the sender we\'ll look into.',
    },
  },
  {
    name: 'countInbox',
    description: 'How many emails do you have in your inbox?',
    exec: function(params) {
      return fetchEmails(params.user, 'in:inbox').then(function(resp) {
        return `You have ${resp.length} emails in your inbox.`;
      });
    },
    params: {
    },
  },
  {
    name: 'countSentToday',
    description: 'How many emails have you sent today?',
    exec: function(params) {
      const today = moment().format('Y/M/D');
      const tomorrow = moment().add(1, 'days').format('Y/M/D');
      const query = `label:sent after:${today} before:${tomorrow}`;
      return fetchEmails(params.user, query).then(function(resp) {
        return `You sent ${resp.length} emails today.`;
      });
    },
    params: {
    },
  },
  {
    name: 'countReceivedToday',
    description: 'How many emails have you received today?',
    exec: function(params) {
      const today = moment().format('Y/M/D');
      const tomorrow = moment().add(1, 'days').format('Y/M/D');
      const query = `to:me after:${today} before:${tomorrow}`;
      return fetchEmails(params.user, query).then(function(resp) {
        return `You received ${resp.length} emails today.`;
      });
    },
    params: {
    },
  },
  {
    name: 'customQuery',
    description: 'Write your own custom gmail query!',
    exec: function(params) {
      const query = params.query;
      return fetchEmails(params.user, query).then(function(resp) {
        const snippets = resp.map(function(re) {
          return `<li>${re}</li>`;
        });
        return `${resp.length} messages match your search:<ul>${snippets.join('')}</ul>`;
      });
    },
    params: {
      query: 'Type the gmail search you\'d like to run.',
    },
  },
];

email.name = 'Email';
email.permissions =  {
  google: ['https://www.googleapis.com/auth/gmail.readonly'],
};

export default email;
