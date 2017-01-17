import teacherSets from './sets/index';

const teacherSetsByName = {};
const teachersByName = {};

teacherSets.forEach((teacherSet) => {
  teacherSetsByName[teacherSet.name] = teacherSet;
  teacherSet.teachers.forEach(teacher => {
    teachersByName[teacher.name] = teacher;
  });
});

export {
  teachersByName,
  teacherSetsByName
};
