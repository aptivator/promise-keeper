import PromiseKeeper from '../components/constructor';

import {rejectHandlers, resolveHandlers, statuses, values} from './vars';

export default status => {
  let handlers = status ? resolveHandlers : rejectHandlers;
  
  return function executor(value) {
    if(value instanceof PromiseKeeper) {
      return value.then(value => executor.call(this, value));
    }
    
    let thisHandlers = handlers.get(this);
    values.set(this, value);
    statuses.set(this, status);
    
    if(thisHandlers.length) {
      setTimeout(() => thisHandlers.forEach(handler => handler(value)));
    }
  };
};
