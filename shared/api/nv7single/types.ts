export interface Element {
  name: string,
  color: string,
  comment: string,
  parents: string[],
}

export class PackInfo {
  title: string
  description: string
  id: string
}

export class PackData {
  id: string
  title: string
  description: string
  data: string
  uid: string
}

export class PackItem {
  title: string
  description: string
  id: string
  uid: string
}
