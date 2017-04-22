import PromiseKeeper from './constructor';
import {rejectHandlers, resolveHandlers, statuses, values} from '../lib/vars';

const warningTitle = 'UnhandledPromiseRejectionWarning';
const warningMessage = 'Unhandled promise rejection';

export default function executor(value, isRejector) {
  if(value instanceof PromiseKeeper) {
    return value.then(
      value => executor.call(this, value),
      value => executor.call(this, value, true)
    );
  }
  
  setTimeout(() => {
    let status = !isRejector;
    let handlers = status ? resolveHandlers : rejectHandlers;
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
}
