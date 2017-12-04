export class Parliament {
  version : string;
  groups  : [Object];
}

export class Group {
  title       : string;
  description : string;
  clusters    : [Object];
}

// TODO combine GroupCreated and Response?
export class GroupCreated {
  group   : Object;
  success : boolean;
  text    : string;
}

export class Response {
  success : boolean;
  text    : string;
}
