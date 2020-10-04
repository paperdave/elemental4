// cool theory
interface Checkable {
  new (): any; 
  checker: (obj: unknown) => boolean;
}
type Schema = Record<string, any>;

function checkType<T extends Checkable>(data: unknown, type: T): data is InstanceType<T> {
  return type.checker(data);
}

function createChecker(schema: Schema, prop?: string): (data: unknown) => boolean {
  const functions = Object.keys(schema)
    .map(x =>
      typeof schema[x] === 'string'
        ? (y: any) => typeof y[x] === schema[x]
        : createChecker(schema[x], x)
      );

  if(prop) {
    return (y: any) => {
      return (
        typeof y === 'object'
        && y !== null
        && typeof y[prop] === 'object'
        && y[prop] !== null
        && functions.every(x => x(y[prop]))
      );
    };
  } else {
    return (y: unknown) => {
      return (
        typeof y === 'object'
        && y !== null
        && functions.every(x => x(y))
      );
    };
  }
}

class Test {
  static checker = createChecker({
    a: 'number',
    b: 'string'
  });

  a: number;
  b: string;

  constructor() {
    this.a=1;
    this.b='2';
  }
}

const data = {};
if(checkType(data, Test)) {

}
