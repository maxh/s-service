// TODO: stronger typing.

export interface ITeacher {
  name: string;
  exec(params: any): any;
  description: string;
  params: any;
}

export interface ITeacherSet {
  name: string;
  teachers: ITeacher[];
  permissions?: any;
}
