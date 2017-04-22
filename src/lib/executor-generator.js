import PromiseKeeper from '../components/constructor';
import {rejectHandlers, resolveHandlers, statuses, values} from './vars';

const warningTitle = 'UnhandledPromiseRejectionWarning';
const warningMessage = 'Unhandled promise rejection';

export default status => {
  let handlers = status ? resolveHandlers : rejectHandlers;
  
  return function executor(value, isRejector) {
    setTimeout(() => {
      if(value instanceof PromiseKeeper) {
        return value.then(value => executor.call(this, value));
      }
      
      let thisHandlers = handlers.get(this);
      values.set(this, value);
      statuses.set(this, status);

      if(thisHandlers.length) {
        return thisHandlers.forEach(handler => handler(value));
      } 
      
      if(isRejector) {
        console.warn(`${warningTitle}: ${warningMessage} (reason: ${value})`);
      }
    });
  };
};
