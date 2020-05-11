import {emptyPromiser}                                  from './_lib/empty-promiser';
import {executor}                                       from './_lib/executor';
import {errors, resolvers, rejectors, statuses, values} from './_lib/vars';
import {thenPromises}                                   from './_lib/vars';
import utils                                            from './_lib/utils';
import 'setimmediate';

export class PromiseKeeper {
  constructor(promiseKeeperCallback) {
    let rejector = reason => executor.call(this, reason, true);
    let resolver = value => executor.call(this, value);
    
    rejectors.set(this, []);
    resolvers.set(this, []);
    
    try {
      promiseKeeperCallback(resolver, rejector);
    } catch(e) {
      let timeout = setImmediate(() => rejector(e));
      errors.set(this, {timeout, e});
    }
  }
  
  static all(promises) {
    let results = [];
    let {length} = promises;
    let fulfilledCount = 0;
    let {promise, rejector, resolver} = emptyPromiser();
    
    promises.forEach((promise, index) => {
      promise.then(result => {
        results[index] = result;
        
        if(++fulfilledCount === length) {
          resolver(results);
        }
      }, rejector);
    });
    
    return promise;
  }
  
  static race(promises) {
    let completed;
    let {promise, rejector, resolver} = emptyPromiser();
    
    function raceGenerator(executor) {
      return value => {
        if(completed) {
          return;
        }
        
        completed = true;
        executor(value);
      };
    }

    for(let promise of promises) {
      if(completed) {
        break;
      }
      
      promise.then(raceGenerator(resolver), raceGenerator(rejector));
    }
    
    return promise;
  }
  
  static reject(reason) {
    return new PromiseKeeper((resolver, rejector) => rejector(reason));
  }
  
  static resolve(value) {
    return new PromiseKeeper(resolver => resolver(value));
  }
  
  catch(rejectHandler) {
    return this.then(undefined, rejectHandler);
  }
  
  finally(callback) {
    return this.then(() => callback(), () => callback());
  }
  
  then(resolveHandler, rejectHandler) {
    let {promise, rejector, resolver} = emptyPromiser();
    
    let handlerRegistrationConfigs = [
      {handler: resolveHandler, handlers: resolvers, executor: resolver, status: true}, 
      {handler: rejectHandler, handlers: rejectors, executor: rejector, status: false}
    ];

    thenPromises.add(this);

    for(let {handler, handlers, executor, status} of handlerRegistrationConfigs) {
      let _handler = value => {
        try {
          if(!handler && !status && !thenPromises.has(promise)) {
            return utils.unhandledRejectionWarning(value);
          }
          
          if(!handler) {
            handler = value => value;
          }

          value = handler(value);
        } catch(e) {
          return rejector(e);
        }
        
        if(thenPromises.has(promise)) {
          executor(value);
        }
      };
      
      if(statuses.get(this) === status) {
        _handler(values.get(this));
        break;
      }
      
      handlers.get(this).push(_handler);
    }
    
    return promise;
  }
}
