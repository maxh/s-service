import request from 'request';
import settings from '../../../settings';
import { ITeacherSet } from '../interface';


const news = {} as ITeacherSet;

news.teachers = [
  {
    name: 'getNYTHeadlines',
    description: 'What\'s going on in the world?',
    exec: function(params) {
      // 2 headlines seems like a great default number of headlines.
      const num = 2;
      return new Promise(function(resolve, reject) {
        request.get({
          url: 'https://api.nytimes.com/svc/topstories/v2/home.json',
          qs: {
            'api-key': settings.auth.keys.nyt
          },
        }, function(err, response, body) {
          if (err) {
            return reject(err);
          }

          body = JSON.parse(body);

          // sort by published date
          const articles = body.results.sort(function(a, b) {
            if (a.published_date > b.published_date) {
              return -1;
            }
            if (a.published_date < b.published_date) {
              return 1;
            }
            return 0;
          });

          const titles = articles.map(function(article) {
            return article.title;
          });

          resolve(titles.slice(0, num).join('; '));
        });
      });
    },
    params: {
      num: 'The number of headlines you\'d like to see.',
    },
  },
  {
    name: 'getLatestNewsOnTopic',
    description: 'What\'s the latest about a specific topic?',
    exec: function(params) {
      const subject = params.subject;
      return new Promise(function(resolve, reject) {
        request.get({
          url: 'https://api.nytimes.com/svc/search/v2/articlesearch.json',
          qs: {
            'api-key': settings.auth.keys.nyt,
            'q': subject,
            'sort': 'newest',
            'page': 0
          },
        }, function(err, response, body) {
          body = JSON.parse(body);

          // sort by publication date
          const articles = body.response.docs.sort(function(a, b) {
            if (a.pub_date > b.pub_date) {
              return -1;
            } else if (a.pub_date < b.pub_date) {
              return 1;
            }
            return 0;
          });

          const titles = articles.map(function(article) {
            return `${article.headline.main}\n${article.lead_paragraph}`;
          });

          resolve(titles.slice(0, 1).join('; '));
        });
      });
    },
    params: {
      subject: 'The topic you\'d like to look up',
    },
  },
];

news.moduleName = 'News';

export default news;
