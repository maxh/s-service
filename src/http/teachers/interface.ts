// TODO: stronger typing.

export interface IHtmlRequest {
  url: string;
  options: any;
}

export interface IAnswer {
  display?: string;
  speech?: string;
  link?: string;
  htmlRequest?: IHtmlRequest;
}

export interface ITeacher {
  name: string;
  description: string;
  params: any;
  exec(params: any): Promise<IAnswer>;
}

export interface IRequiredPermission {
  provider: string;
  providerInfo?: any;
}

export interface ITeacherSet {
  name: string;
  teachers: ITeacher[];
  requiredPermissions?: IRequiredPermission[];
}
