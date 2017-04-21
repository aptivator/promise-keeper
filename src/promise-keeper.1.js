let Zousan = require('zousan');
let _ = require('lodash');

const statuses = new WeakMap();
const values = new WeakMap();
const fulfillers = new WeakMap();
const rejectors = new WeakMap();

let executorGenerator = (status) => {
  let callbacks = status ? fulfillers : rejectors;
  
  return function executor(value) {
    if(typeof value === 'object' && value.then) {
      return value.then(value => executor.call(this, value));
    }

    values.set(this, value);
    statuses.set(this, status);
    let handlers = callbacks.get(this);
    if(handlers.length) {
      setTimeout(() => handlers.forEach(handler => handler(value)));
    }
  };
};

let resolver = executorGenerator(true);

let rejector = executorGenerator(false); 

let handlerMaker = (thener, resolver, rejector) => {
  return value => {
    if(typeof thener === 'function') {
      try {
        value = thener(value);
      } catch(e) {
        return rejector(e);
      }
    }
    
    resolver(value, rejector);
  };
};

let handlerRegistrar = (key, status, thener, resolver, rejector) => {
  let handlers = status ? fulfillers : rejectors;
  
  if(!thener) {
    if(!status) {
      resolver = rejector;
    }
    
    thener = value => value;
  }
  
  let handler = handlerMaker(thener, resolver, rejector);
  
  if(statuses.get(key) === status) {
    return setTimeout(() => handler(values.get(key)));
  }
  
  handlers.get(key).push(handler);
};

let emptyPromise = () => {
  let resolver, rejector;
  let promise = new PromiseKeeper((...args) => [resolver, rejector] = args);
  return [promise, resolver, rejector];
};

let racer = (executor, promises) => {
  return value => {
    if(promises.fulfilled) {
      return;
    }
    promises.fulfilled = true;
    executor(value);
  };
};

class PromiseKeeper {
  constructor(promiseBody) {
    fulfillers.set(this, []);
    rejectors.set(this, []);
    promiseBody(resolver.bind(this), rejector.bind(this));
  }
  
  then(onFulfilled, onRejected) {
    let [promise, resolver, rejector] = emptyPromise();
    handlerRegistrar(this, true, onFulfilled, resolver, rejector);
    handlerRegistrar(this, false, onRejected, resolver, rejector);
    return promise;
  }
  
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  
  static resolve(value) {
    return new PromiseKeeper(resolve => resolve(value));
  }
  
  static reject(reason) {
    return new PromiseKeeper((resolve, reject) => reject(reason));
  }
  
  static all(promises) {
    let results = [];
    let {length} = promises;
    let numberFulfilled = 0;
    let [promise, resolver, rejector] = emptyPromise();
    
    promises.forEach((promise, index) => {
      promise.then(result => {
        results[index] = result;
        if(++numberFulfilled === length) {
          resolver(results);
        }
      }, rejector);
    });
    
    return promise;
  }
  
  static race(promises) {
    let [promise, resolver, rejector] = emptyPromise();
    promises.forEach(promise => {
      promise.then(racer(resolver, promises), racer(rejector, promises));
    });
    
    return promise;
  }
}

let c = console.log.bind(console);

console.log('---------------------------');
let promise = new PromiseKeeper((resolve, reject) => setTimeout(() => reject(22), 100));
promise.catch(e => {throw e;}).catch(e => {throw e;}).catch(e => {throw e;}).catch(c);
promise.catch(e => {throw e;}).catch(e => {throw e;}).catch(e => {throw e;}).catch(c);
promise.catch(e => {throw e;}).catch(e => {throw e;}).catch(e => {throw e;}).catch(c);
promise.catch(e => {throw e;}).catch(e => {throw e;}).catch(e => {throw e;}).catch(c);
let promise2 = promise.catch(e => {throw e;}).catch(e => {throw e;}).catch(e => {throw e;});
promise2.catch(c);
