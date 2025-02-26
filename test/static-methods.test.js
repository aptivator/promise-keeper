import {expect}                           from 'chai';
import {aggregateErrorMessage}            from '../src/_lib/vars';
import {PromiseKeeper}                    from '../src/promise-keeper';
import {trap}                             from './_lib/trap';
import {rejectionReason, resolutionValue} from './_lib/vars';

describe('static methods', () => {
  let result;
  afterEach(() => {trap.a.clear(); result = undefined;});

  describe('all()', () => {
    it('returns an ordered array of results from an array of promises', (done) => {
      let results = [1, 2, 3];
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[0]));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 10, results[1]));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[2]));
      
      PromiseKeeper.all(trap.a.store).then((_results) => {
        expect(_results).to.eql(results);
        done();
      });
    });
    
    it('returns reason if a promise fails', (done) => {
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, rejectionReason));
      
      PromiseKeeper.all(trap.a.store).then(undefined, (reason) => {
        expect(reason).to.equal(rejectionReason);
        done();
      });
    });
  });
  
  describe('allSettled()', () => {
    it('returns an array of object results from an array of settled promises', (done) => {
      let results = [10, 'rejected', 25];
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[0]));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, results[1]));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[2]));
      
      PromiseKeeper.allSettled(trap.a.store).then((_results) => {
        expect(_results).to.eql([
          {status: 'fulfilled', value: results[0]},
          {status: 'rejected', reason: results[1]},
          {status: 'fulfilled', value: results[2]}
        ]);
  
        done();
      });
    });
    
    it('produces an empty array if an empty array is given', (done) => {
      PromiseKeeper.allSettled([]).then((results) => {
        expect(results).to.eql([]);
        done();
      });
    });
  
    it('outputs an empty array when called without parameters', (done) => {
      PromiseKeeper.allSettled().then((results) => {
        expect(results).to.eql([]);
        done();
      });
    });
  });

  describe('any()', () => {
    it('returns first fulfilled promise value', () => {
      trap.a = new PromiseKeeper((resolve) => resolve(resolutionValue));
      trap.a = new PromiseKeeper((resolve, reject) => reject('rejected'));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 10));

      PromiseKeeper.any(trap.a.store).then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('errors with AggregateError when all promises reject', (done) => {
      let errors = [25, 'rejected', 10];
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 10, errors[0]));
      trap.a = new PromiseKeeper((resolve, reject) => reject(errors[1]));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, errors[2]));

      PromiseKeeper.any(trap.a.store).catch((reason) => {
        expect(reason).to.be.an.instanceOf(AggregateError);
        expect(reason.message).to.equal(aggregateErrorMessage);
        expect(reason.errors).to.eql(errors);
        done();
      });
    });

    it('rejects with an empty AggregateError when no promises are provided', () => {
      PromiseKeeper.any([]).catch((reason) => result = reason);
      expect(result.errors).to.eql([]);
    });

    it('defaults to an empty array if no parameter is provided', () => {
      PromiseKeeper.any().catch((reason) => result = reason);
      expect(result.errors).to.eql([]);
    });
  });

  describe('race()', () => {
    it('returns value of first resolved promise', (done) => {
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 20, 1));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, resolutionValue));
      
      PromiseKeeper.race(trap.a.store).then((value) => {
        expect(value).to.equal(resolutionValue);
        done();
      });
    });
    
    it('returns rejection if it occurs first', (done) => {
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 20, 1));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, rejectionReason));

      PromiseKeeper.race(trap.a.store).catch((reason) => {
        expect(reason).to.equal(rejectionReason);
        done();
      });
    });
  });

  describe('reject()', () => {
    it('returns a rejected promise', () => {
      let promise = PromiseKeeper.reject(rejectionReason);
      promise.then(undefined, (reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
  });

  describe('resolve()', () => {
    it('returns a resolved promise', () => {
      let promise = PromiseKeeper.resolve(resolutionValue);
      promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });
  });

  describe('try()', () => {
    it('executes a synchronous function and promisifies its result', () => {
      let params = [1, 2];
      let func = (n1, n2) => n1 + n2;
      let output = func(...params);
      let promise = PromiseKeeper.try(func, ...params);
      promise.then((value) => result = value);
      expect(result).to.equal(output);
    });

    it('catches an error thrown by a synchronous function', () => {
      let error = 'error';
      let func = () => {throw error;};
      let promise = PromiseKeeper.try(func);
      promise.catch((reason) => result = reason);
      expect(result).to.equal(error);
    });

    it('handshakes the promise returned by a function with its own promise', (done) => {
      let func = (value) => new PromiseKeeper((resolve) => setTimeout(resolve, 0, value));
      let promise = PromiseKeeper.try(func, resolutionValue);
      promise.then((value) => {
        expect(value).to.equal(resolutionValue);
        done();
      });
    });

    it('triggers reject of its own promise if a promise returned by a function is rejected', (done) => {
      let func = (reason) => new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, reason));
      let promise = PromiseKeeper.try(func, rejectionReason);
      promise.catch((reason) => {
        expect(reason).to.equal(rejectionReason);
        done();
      });
    });
  });

  describe('withResolvers()', () => {
    it('returns a promise plus its resolve and reject methods', () => {
      let {promise, resolve, reject} = PromiseKeeper.withResolvers();
      expect(promise).to.be.an.instanceOf(PromiseKeeper);
      expect(resolve).to.be.a('function');
      expect(reject).to.be.a('function');
    });

    it('fulfills a promise through a resolve() call', () => {
      let {promise, resolve} = PromiseKeeper.withResolvers();
      resolve(resolutionValue);
      promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('settles a promise through a reject() call', () => {
      let {promise, reject} = PromiseKeeper.withResolvers();
      reject(rejectionReason);
      promise.then(undefined, (reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
  });
});
