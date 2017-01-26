import { ITeacherSet } from '../interface';


const wikipedia = {} as ITeacherSet;

wikipedia.teachers = [
  {
    name: 'fetchArticle',
    description: 'Open a wikipedia page.',
    exec: function(params) {
      return new Promise(function(resolve, reject) {
        const url = 'https://en.wikipedia.org/wiki/' + params.title;
        const htmlLink = `<a href="${url}">${url}</a>`;
        resolve(htmlLink);
      });
    },
    params: {
      title: 'The title of the wikipedia page to open',
    },
  }
];

wikipedia.name = 'Wikipedia';

export default wikipedia;
