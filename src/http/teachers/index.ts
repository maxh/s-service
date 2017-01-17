import airtable from './airtable';
import basic from './basic';
import bitcoin from './bitcoin';
import browser from './browser';
import calendar from './calendar';
import chemistry from './chemistry';
import datetime from './datetime';
import dropbox from './dropbox';
import email from './email';
import finance from './finance';
import gdrive from './gdrive';
import geo from './geo';
import news from './news';
import timer from './timer';
import weather from './weather';


const teacherSets = [
  airtable,
  basic,
  bitcoin,
  browser,
  calendar,
  chemistry,
  datetime,
  dropbox,
  email,
  finance,
  gdrive,
  geo,
  news,
  timer,
  weather,
];

const moduleNamesToTeacherSet = {};
const teacher = {};

teacherSets.forEach((teacherSet) => {
  moduleNamesToTeacherSet[teacherSet.moduleName] = teacherSet;
  teacherSet.teachers.forEach(teacher => {
    teacher[teacher.name] = teacher;
  });
});

export teacher;
