export function createJoinedQueue(): (<A extends any[], R>(cb: (...a: A) => Promise<R>) => ((...a: A) => Promise<R>) & { callLater: (...a: A) => Promise<R> }) & { callLater: () => <A extends any[], R>(cb, ...a: A) => Promise<R> } {
  let running = false;
  let queue = [];
  const f = function(cb) {
    const f = async function func(...args) {
      if(running) {
        return new Promise((r, e) => queue.push([func, args, r, e]));
      }
      running = true;
      const r = await cb(...args);
      running = false
      if (queue.length > 0) {
        const [f, args, r, e] = queue.shift();
        f(...args).then(r).catch(e);
      }
      return r;
    }
    f.callLater = (...args) => {
      return new Promise((r, e) => queue.push([cb, args, r, e]));
    };
    return f;
  }
  f.callLater = (cb, ...args) => {
    return new Promise((r, e) => queue.push([cb, args, r, e]));
  };
  return f as any;
}
export function createQueueExec<A extends any[], R>(cb: (...a: A) => Promise<R>) {
  return createJoinedQueue()(cb);
}
