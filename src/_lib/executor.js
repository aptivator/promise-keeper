import {PromiseKeeper}                                  from '../promise-keeper';
import {errors, rejectors, resolvers, statuses, values} from './vars';
import utils                                            from './utils';

export function executor(value, isRejector = false) {
  let isPromiseKeeper = value instanceof PromiseKeeper;
  let error = isPromiseKeeper && errors.get(value);

  if(error) {
    let {e, timeout} = error;
    clearImmediate(timeout);
    throw e;
  }
  
  if(isPromiseKeeper && !error) {
    return value.then(
      value => executor.call(this, value),
      reason => executor.call(this, reason, true)
    );
  }
  
  setImmediate(() => {
    let handlers = isRejector ? rejectors : resolvers;
    handlers = handlers.get(this);

    values.set(this, value);
    statuses.set(this, !isRejector);
    
    if(handlers.length) {
      return handlers.forEach(handler => handler(value));
    }
    
    if(isRejector) {
      utils.unhandledRejectionWarning(value);
    }
  });
}
