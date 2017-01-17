import { ITeacherSet } from '../interface';


const browser = {} as ITeacherSet;

browser.teachers = [
  {
    name: 'openLink',
    description: 'Open a link in the browser.',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        // TODO: check if it's a link
        const htmlLink = `<a href='${params.link}' target='_blank'>${params.link}</a>`;
        resolve(htmlLink);
      });
    },
    params: {
      link: 'The link you want to open',
    },
  }
];

browser.moduleName = 'Browser';

export default browser;
