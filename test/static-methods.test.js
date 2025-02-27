import {expect}                           from 'chai';
import {aggregateErrorMessage}            from '../src/_lib/vars';
import {PromiseKeeper}                    from '../src/promise-keeper';
import {trap}                             from './_lib/trap';
import {rejectionReason, resolutionValue} from './_lib/vars';

describe('static methods', () => {
  let result;
  afterEach(() => {trap.a.clear(); result = undefined;});

  describe('all()', () => {
    it('returns an ordered array of results from an array of promises', async () => {
      let results = [1, 2, 3];
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[0]));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 10, results[1]));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[2]));
      let _results = await PromiseKeeper.all(trap.a.store);
      expect(_results).to.eql(results);
    });
    
    it('returns reason if a promise fails', async () => {
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, rejectionReason));
      
      try {
        await PromiseKeeper.all(trap.a.store);
        throw 'should not happen';
      } catch(reason) {
        expect(reason).to.equal(rejectionReason);
      }
    });
  });
  

  describe('allSettled()', () => {
    it('returns an array of object results from an array of settled promises',  async () => {
      let results = [10, 'rejected', 25];
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[0]));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, results[1]));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, results[2]));
      let _results = await PromiseKeeper.allSettled(trap.a.store);
      
      expect(_results).to.eql([
        {status: 'fulfilled', value: results[0]},
        {status: 'rejected', reason: results[1]},
        {status: 'fulfilled', value: results[2]}
      ]);
    });
    
    it('produces an empty array if an empty array is given', async () => {
      await PromiseKeeper.allSettled([]).then((results) => result = results);
      expect(result).to.eql([]);
    });

    it('outputs an empty array when called without parameters', async () => {
      await PromiseKeeper.allSettled().then((results) => result = results);
      expect(result).to.eql([]);
    });
  });

  describe('any()', () => {
    it('returns first fulfilled promise value', async () => {
      trap.a = new PromiseKeeper((resolve) => resolve(resolutionValue));
      trap.a = new PromiseKeeper((resolve, reject) => reject('rejected'));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 10));
      await PromiseKeeper.any(trap.a.store).then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('errors with AggregateError when all promises reject', async () => {
      let errors = [25, 'rejected', 10];
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 10, errors[0]));
      trap.a = new PromiseKeeper((resolve, reject) => reject(errors[1]));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, errors[2]));
      await PromiseKeeper.any(trap.a.store).catch((reason) => result = reason);
      expect(result).to.be.an.instanceOf(AggregateError);
      expect(result.message).to.equal(aggregateErrorMessage);
      expect(result.errors).to.eql(errors);
    });

    it('rejects with an empty AggregateError when no promises are provided', async () => {
      await PromiseKeeper.any([]).catch((reason) => result = reason);
      expect(result.errors).to.eql([]);
    });

    it('defaults to an empty array if no parameter is provided', async () => {
      await PromiseKeeper.any().catch((reason) => result = reason);
      expect(result.errors).to.eql([]);
    });
  });

  describe('race()', () => {
    it('returns value of first resolved promise', async () => {
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 20, 1));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 0, resolutionValue));
      await PromiseKeeper.race(trap.a.store).then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });
    
    it('returns rejection if it occurs first', async () => {
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 20, 1));
      trap.a = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      trap.a = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, rejectionReason));
      await PromiseKeeper.race(trap.a.store).catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
  });

  describe('reject()', () => {
    it('returns a rejected promise', async () => {
      await PromiseKeeper.reject(rejectionReason).then(undefined, (reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
  });

  describe('resolve()', () => {
    it('returns a resolved promise', async () => {
      await PromiseKeeper.resolve(resolutionValue).then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });
  });

  describe('try()', () => {
    it('executes a synchronous function and promisifies its result', async () => {
      let params = [1, 2];
      let func = (n1, n2) => n1 + n2;
      let output = func(...params);
      await PromiseKeeper.try(func, ...params).then((value) => result = value);
      expect(result).to.equal(output);
    });

    it('catches an error thrown by a synchronous function', async () => {
      let error = 'error';
      let func = () => {throw error;};
      await PromiseKeeper.try(func).catch((reason) => result = reason);
      expect(result).to.equal(error);
    });

    it('handshakes the promise returned by a function with its own promise', async () => {
      let func = (value) => new PromiseKeeper((resolve) => setTimeout(resolve, 0, value));
      await PromiseKeeper.try(func, resolutionValue).then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('triggers reject of its own promise if a promise returned by a function is rejected', async () => {
      let func = (reason) => new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, reason));
      await PromiseKeeper.try(func, rejectionReason).catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
  });

  describe('withResolvers()', () => {
    it('returns a promise plus its resolve and reject methods', () => {
      let {promise, resolve, reject} = PromiseKeeper.withResolvers();
      expect(promise).to.be.an.instanceOf(PromiseKeeper);
      expect(resolve).to.be.a('function');
      expect(reject).to.be.a('function');
    });

    it('fulfills a promise through a resolve() call', async () => {
      let {promise, resolve} = PromiseKeeper.withResolvers();
      resolve(resolutionValue);
      await promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('settles a promise through a reject() call', async () => {
      let {promise, reject} = PromiseKeeper.withResolvers();
      reject(rejectionReason);
      await promise.then(undefined, (reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
  });
});
