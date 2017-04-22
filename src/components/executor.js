import PromiseKeeper from './constructor';
import {errors, rejectHandlers, resolveHandlers, statuses, values} from '../lib/vars';

const warningTitle = 'UnhandledPromiseRejectionWarning';
const warningMessage = 'Unhandled promise rejection';

export default function executor(value, isRejector) {
  let isPromiseKeeper = value instanceof PromiseKeeper;
  let error = isPromiseKeeper ? errors.get(value) : null;
  
  if(isPromiseKeeper) {
    if(!error) {
      return value.then(
        value => executor.call(this, value),
        value => executor.call(this, value, true)
      );
    }
  }
  
  if(error) {
    let {e, timeout} = error;
    clearTimeout(timeout);
    throw e;
  }
  
  setTimeout(() => {
    let handlers = isRejector ? rejectHandlers : resolveHandlers;
    let thisHandlers = handlers.get(this);
    
    values.set(this, value);
    statuses.set(this, !isRejector);

    if(thisHandlers.length) {
      return thisHandlers.forEach(handler => handler(value));
    } 
    
    if(isRejector) {
      console.warn(`${warningTitle}: ${warningMessage} (reason: ${value})`);
    }         
  });
}
