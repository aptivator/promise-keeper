import {getAggregateError, unhandledRejectionWarning} from './_lib/utils';

export class PromiseKeeper {
  #onRejects = [];
  #onResolves = [];
  #reason;
  #status;
  #thenned;
  #value;

  constructor(callback) {
    let resolve = (value) => this.#settleResolve(value);
    let reject = (reason) => this.#settleReject(reason);

    try {
      callback(resolve, reject);
    } catch(e) {
      reject(this.#reason || e);
    }
  }

  #settleResolve(value) {
    if(value instanceof PromiseKeeper) {
      return value.then(
        (value) => this.#settleResolve(value),
        (reason) => {
          this.#reason = reason;
          this.#settleReject(reason);
        }
      );
    }

    this.#value = value;
    this.#status = true;

    queueMicrotask(() => {
      this.#onResolves.forEach((onResolve) => {
        onResolve(value);
      });
    });
  }

  #settleReject(reason) {
    if(reason instanceof PromiseKeeper) {
      let rejector = (reason) => {
        this.#reason = reason;
        this.#settleReject(reason);
      }

      return reason.then(rejector, rejector);
    }
    
    this.#reason ??= reason;
    this.#status = false;

    queueMicrotask(() => {
      if(this.#thenned) {
        return this.#onRejects.forEach((onReject) => {
          onReject(this.#reason);
        });
      }

      unhandledRejectionWarning(this.#reason);
    });
  }

  static all(promises) {
    let results = [];
    let {length} = promises;
    let fulfilledCount = 0;
    let {promise, reject, resolve} = PromiseKeeper.withResolvers();

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
    let {promise, resolve} = PromiseKeeper.withResolvers();

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
    let {promise, reject, resolve} = PromiseKeeper.withResolvers();
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
    let {promise, reject, resolve} = PromiseKeeper.withResolvers();
    let [onResolve, onReject] = [resolve, reject].map((settle) => {
      return (value) => {
        if(!completed) {
          completed = true;
          settle(value);
        }
      };
    });

    for(let promise of promises) {
      promise.then(onResolve, onReject);
    }
    
    return promise;
  }
  
  static reject(reason) {
    return new PromiseKeeper((resolve, reject) => reject(reason));
  }
  
  static resolve(value) {
    return new PromiseKeeper((resolve) => resolve(value));
  }
  
  static try(func, ...args) {
    let {promise, resolve, reject} = PromiseKeeper.withResolvers();

    try {
      let result = func(...args);
      resolve(result);
    } catch(e) {
      reject(e);
    }

    return promise;
  }

  static withResolvers() {
    let resolve, reject;
    let promise = new PromiseKeeper((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    
    return {promise, resolve, reject};
  }

  catch(onReject) {
    return this.then(undefined, onReject);
  }
  
  finally(callback) {
    let {promise, resolve, reject} = PromiseKeeper.withResolvers();

    function executeCallback() {
      try {
        callback();
        return true;
      } catch(e) {
        reject(e);
      }
    }

    this.then((value) => {
      if(executeCallback()) {
        resolve(value);
      }
    }, (reason) => {
      if(executeCallback()) {
        reject(reason);
      }
    });

    return promise;
  }
  
  #makeOnResolve(onResolve, resolve, reject) {
    return function(value) {
      try {
        if(onResolve) {
          value = onResolve(value);
        }

        resolve(value);
      } catch(e) {
        return reject(e);
      }
    }
  }

  #makeOnReject(onReject, resolve, reject) {
    return function(reason) {
      try {
        if(onReject) {
          reason = onReject(reason);
          return resolve(reason);
        }

        throw reason;
      } catch(e) {
        reject(e);
      }
    }
  }

  then(onResolve, onReject) {
    let {promise, resolve, reject} = PromiseKeeper.withResolvers();
    
    this.#thenned = true;

    if(this.#status) {
      onResolve = this.#makeOnResolve(onResolve, resolve, reject);
      queueMicrotask(() => onResolve(this.#value));
    } else if(this.#status === false) {
      onReject = this.#makeOnReject(onReject, resolve, reject);
      queueMicrotask(() => onReject(this.#reason));
    } else {
      onResolve = this.#makeOnResolve(onResolve, resolve, reject);
      onReject = this.#makeOnReject(onReject, resolve, reject);
      this.#onResolves.push(onResolve);
      this.#onRejects.push(onReject);
    }

    return promise;
  }
}
