import {getAggregateError, getPromiseParts} from './_lib/utils';
import {unhandledRejectionWarning}          from './_lib/utils';
import {thenPromises}                       from './_lib/vars';

export class PromiseKeeper {
  #onRejects = [];
  #onResolves = [];
  #status;
  #value;

  constructor(callback) {
    let resolve = (value) => this.#settle(value);
    let reject = (reason) => this.#settle(reason, true);

    try {
      callback(resolve, reject);
    } catch(e) {
      reject(e);
    }
  }
  
  #settle(value, isRejector = false) {
    if(value instanceof PromiseKeeper) {
      return value.then(
        (value) => this.#settle(value),
        (reason) => this.#settle(reason, true)
      );
    }

    queueMicrotask(() => {
      let onSettleHandlers = isRejector ? this.#onRejects : this.#onResolves;
      this.#value = value;
      this.#status = !isRejector;
  
      if(onSettleHandlers.length) {
        return onSettleHandlers.forEach((onSettle) => onSettle(value));
      }
  
      if(isRejector) {
        unhandledRejectionWarning(value);
      }
    });
  }

  static all(promises) {
    let results = [];
    let {length} = promises;
    let fulfilledCount = 0;
    let {promise, reject, resolve} = getPromiseParts();

    promises.forEach((promise, index) => {
      promise.then((result) => {
        results[index] = result;
        
        if(++fulfilledCount === length) {
          resolve(results);
        }
      }, reject);
    });
    
    return promise;
  }
  
  static allSettled(promises = []) {
    let results = [];
    let {length} = promises;
    let settledCount = 0;
    let {promise, resolve} = getPromiseParts();

    if(length) {
      promises.forEach((promise, index) => {
        promise
          .then(
            (value) => results[index] = {status: 'fulfilled', value},
            (reason) => results[index] = {status: 'rejected', reason}
          )
          .finally(() => {
            if(++settledCount === length) {
              resolve(results);
            }
          });
      });
    } else {
      resolve(results);
    }

    return promise;
  }

  static any(promises = []) {
    let {length} = promises;
    let reasons = [];
    let fulfilled;
    let rejectedCount = 0;
    let {promise, reject, resolve} = getPromiseParts();
    let _reject = () => reject(getAggregateError(reasons));

    if(length) {
      promises.forEach((promise, index) => {
        promise.then((value) => {
          if(!fulfilled) {
            fulfilled = true;
            resolve(value);
          }
        }, (reason) => {
          if(!fulfilled) {
            reasons[index] = reason;
            
            if(++rejectedCount === length) {
              _reject();
            }
          }
        });
      });
    } else {
      _reject();
    }

    return promise;
  }

  static race(promises) {
    let completed;
    let {promise, reject, resolve} = getPromiseParts();
    
    function raceGenerator(settle) {
      return (value) => {
        if(completed) {
          return;
        }
        
        completed = true;
        settle(value);
      };
    }

    for(let promise of promises) {
      promise.then(raceGenerator(resolve), raceGenerator(reject));
    }
    
    return promise;
  }
  
  static reject(reason) {
    return new PromiseKeeper((resolve, reject) => reject(reason));
  }
  
  static resolve(value) {
    return new PromiseKeeper((resolve) => resolve(value));
  }
  
  catch(onReject) {
    return this.then(undefined, onReject);
  }
  
  finally(callback) {
    return this.then(() => callback(), () => callback());
  }
  
  then(onResolve, onReject) {
    let {promise, reject, resolve} = getPromiseParts();
    
    let settlersConfigs = [
      [onResolve, this.#onResolves, resolve, true], 
      [onReject, this.#onRejects, reject, false]
    ];

    thenPromises.add(this);

    for(let [onSettle, onSettleHandlers, settle, status] of settlersConfigs) {
      let internalOnSettle = ((onSettle, status) => {
        return function(value) {
          if(!status && !onSettle && !thenPromises.has(promise)) {
            return unhandledRejectionWarning(value);
          }

          try {
            if(onSettle) {
              value = onSettle(value);
            }
          } catch(e) {
            return reject(e);
          }
          
          if(thenPromises.has(promise)) {
            settle(value);
          }
        }
      })(onSettle, status);
      
      if(this.#status === status) {
        internalOnSettle(this.#value);
        break;
      }
      
      onSettleHandlers.push(internalOnSettle);
    }
    
    return promise;
  }
}
