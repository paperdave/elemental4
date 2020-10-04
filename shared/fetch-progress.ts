import { Emitter } from '@reverse/emitter';

export function fetchWithProgress(r: Response, dataEvents: boolean = false): Emitter & { headers: Headers } {
  const events = new Emitter() as any;

  events.headers = r.headers;

  (async() => {
    
    const reader = r.body.getReader();
    // Step 2: get total length
    const contentLength = +r.headers.get('Content-Length');
  
    // Step 3: read the data
    let receivedLength = 0; // received that many bytes at the moment
    let chunks = []; // array of received binary chunks (comprises the body)
    while(true) {
      const {done, value} = await reader.read();
  
      if (done) {
        break;
      }
  
      chunks.push(value);
      receivedLength += value.length;
  
      if(dataEvents) events.emit('data', new TextDecoder("utf-8").decode(value));
      events.emit('progress', { percent: receivedLength / contentLength, current: receivedLength, total: contentLength })
    }
  
    // Step 4: concatenate chunks into single Uint8Array
    let chunksAll = new Uint8Array(receivedLength); // (4.1)
    let position = 0;
    for(let chunk of chunks) {
      chunksAll.set(chunk, position); // (4.2)
      position += chunk.length;
    }
  
    // Step 5: decode into a string
    let result = new TextDecoder("utf-8").decode(chunksAll);
    events.emit('done', result);
  })()

  return events;
}
