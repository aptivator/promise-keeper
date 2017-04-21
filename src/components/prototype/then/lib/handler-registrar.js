import handlerGenerator from './handler-generator';

import {resolveHandlers, rejectHandlers, statuses, values} from '../../../../lib/vars';

export default (key, status, handler, resolver, rejector) => {
  let handlers = status ? resolveHandlers : rejectHandlers;
  
  if(!handler) {
    if(!status) {
      resolver = rejector;
    }
    
    handler = value => value;
  }
  
  handler = handlerGenerator(handler, resolver, rejector);
  
  if(statuses.get(key) === status) {
    return setTimeout(() => handler(values.get(key)));
  }
  
  handlers.get(key).push(handler);
};
