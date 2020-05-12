import {PromiseKeeper}                                  from '../promise-keeper';
import {errors, rejectors, resolvers, statuses, values} from './vars';
import utils                                            from './utils';

export function executor(promiseInstance, value, isRejector = false) {
  let isPromiseKeeper = value instanceof PromiseKeeper;
  let error = isPromiseKeeper && errors.get(value);

  if(error) {
    let {e, timeout} = error;
    clearTimeout(timeout);
    throw e;
  }
  
  if(isPromiseKeeper) {
    return value.then(
      value => executor(promiseInstance, value),
      reason => executor(promiseInstance, reason, true)
    );
  }
  
  setTimeout(() => {
    let handlers = isRejector ? rejectors : resolvers;
    handlers = handlers.get(promiseInstance);

    values.set(promiseInstance, value);
    statuses.set(promiseInstance, !isRejector);
    
    if(handlers.length) {
      return handlers.forEach(handler => handler(value));
    }
    
    if(isRejector) {
      utils.unhandledRejectionWarning(value);
    }
  });
}
