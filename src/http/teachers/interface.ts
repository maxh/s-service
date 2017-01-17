// TODO: stronger typing.

export interface ITeacher {
  name: string;
  description: string;
  params: any;
  exec(params: any): any;
}

export interface ITeacherSet {
  name: string;
  teachers: ITeacher[];
  permissions?: any;
}
