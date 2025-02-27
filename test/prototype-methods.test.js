import {expect}                           from 'chai';
import {makeUnhandledRejectionWarning}    from '../src/_lib/utils';
import {PromiseKeeper}                    from '../src/promise-keeper';
import {pause, pauseMs}                   from './_lib/utils';
import {rejectionReason, resolutionValue} from './_lib/vars';

describe('prototype methods', () => {
  let result;
  let warn;
  let warningMessage;

  before(() => {
    ({warn} = console);
    console.warn = (message) => warningMessage = message;
  });
  afterEach(() => {result = undefined; warningMessage = undefined});
  after(() => Object.assign(console, {warn}));

  describe('constructor', () => {
    it('creates an instance of PromiseKeeper that gives resolver and rejector to its callback', () => {
      let promise = new PromiseKeeper((resolve, reject) => result = [typeof resolve, typeof reject]);
      expect(result).to.eql(Array(2).fill('function'));
      expect(promise).to.be.an.instanceOf(PromiseKeeper);
    });

    it('prints a warning when no handler is provided for a promise body error', async () => {
      let error = new Error(rejectionReason);
      new PromiseKeeper(() => {throw error;});
      await pause();
      expect(warningMessage).to.include(makeUnhandledRejectionWarning(error));
    });

    it('passes promise-body-thrown error to rejection handler', async () => {
      let promise = new PromiseKeeper(() => {throw new Error(rejectionReason)});
      await promise.catch((reason) => result = reason);
      expect(result.message).to.equal(rejectionReason);
    });
  });

  describe('promise body resolve()', () => {
    it(`connects a passed promise value to to its own's promise's fulfillment mechanism`, async () => {
      let promise = new PromiseKeeper((resolve) => {
        let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
        resolve(promise);
      });
      await promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('prioritizes the first promise-body-thrown error', async () => {
      let promise = new PromiseKeeper((resolve) => {
        resolve(new PromiseKeeper((resolve) => {
          resolve(new PromiseKeeper(() => {
            throw 'nested error';
          }));
          throw 'inner error';
        }));
        throw 'error';
      });
      
      await promise.catch((reason) => result = reason);
      expect(result).to.equal('nested error');
    });
  });

  describe('promise body reject()', () => {
    it(`connects a passed promise value to to its own's promise's fulfillment mechanism`, async () => {
      let promise = new PromiseKeeper((resolve, reject) => {
        let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
        reject(promise);
      });

      await promise.catch((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });

    it('prioritizes the first promise-body-thrown error', async () => {
      let promise = new PromiseKeeper((resolve, reject) => {
        reject(new PromiseKeeper((resolve, reject) => {
          reject(new PromiseKeeper(() => {
            throw 'nested error';
          }));
          throw 'inner error';
        }));
        throw 'error';
      });
      
      await promise.catch((reason) => result = reason);
      expect(result).to.equal('nested error');
    });
  });

  describe('catch()', () => {
    it('registers rejection handler', async () => {
      let reason = 'rejected';
      let promise = new PromiseKeeper((resolve, reject) => reject(reason));
      await promise.catch((reason) => result = reason);
      expect(result).to.equal(reason);
    });

    it('requires resolution handler if catch handler returns non-error value', async () => {
      let promise = new PromiseKeeper(() => {throw '';});
      await promise.catch(() => resolutionValue).then((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });
    
    it('picks up an error thrown in a rejection handler', async () => {
      let promise = new PromiseKeeper(() => {throw '';});
      await promise.catch(() => {throw rejectionReason;}).catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });

    it('generates a warning if an error thrown in a rejection handler is not picked up', async () => {
      let promise = new PromiseKeeper(() => {throw '';});
      promise.catch(() => {throw rejectionReason;});
      await pause();
      expect(warningMessage).to.equal(makeUnhandledRejectionWarning(rejectionReason));
    });
  });

  describe('finally()', () => {
    it('triggers finally callback after the promise is resolved', async () => {
      let results = [];
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      await promise.then((value) => results.push(value)).finally(() => results.push('done'));
      expect(results).to.eql([resolutionValue, 'done']);
    });

    it('invokes finally callback after the promise is rejected', async () => {
      let results = [];
      let promise = new PromiseKeeper((resolve, reject) => reject(rejectionReason));
      await promise.catch((reason) => results.push(reason)).finally(() => results.push('done'));
      expect(results).to.eql([rejectionReason, 'done']);
    });

    it('passes no parameters to the callback', async () => {
      let promise = PromiseKeeper.resolve(resolutionValue);
      result = resolutionValue;
      await promise.finally((value) => result = value);
      expect(result).to.be.undefined;
    });

    it('returns a resolved promise with the latest previously resolved value', async () => {
      let results = [];
      let p1 = PromiseKeeper.resolve(resolutionValue);
      let p2 = p1.then((value) => {results.push(value); return 'value';})
      let p3 = p2.finally(() => results.push('finally'))
      await p3.then((value) => results.push(value));
      expect(results).to.eql([resolutionValue, 'finally', 'value']);
    });

    it('produces a rejected promise with the latest uncaught rejection reason', async () => {
      let results = [];
      let promise = PromiseKeeper.reject(rejectionReason);
      await promise.finally(() => results.push('finally')).catch((reason) => results.push(reason));
      expect(results).to.eql(['finally', rejectionReason]);
    });

    it('outputs a warning if its rejected promise is without an error handler', async () => {
      PromiseKeeper.reject(rejectionReason).finally(() => {});
      await pause();
      expect(warningMessage).to.equal(makeUnhandledRejectionWarning(rejectionReason));
    });

    it(`delivers a rejected promise if its callback throws`, async () => {
      let p1 = PromiseKeeper.resolve(resolutionValue).finally(() => {throw rejectionReason;});
      await p1.catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });

    it(`hands a rejected promise with its callback's error even if a downstream promise is rejected`, async () => {
      let p1 = PromiseKeeper.reject(rejectionReason).finally(() => {throw resolutionValue;});
      await p1.catch((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });
  });

  describe('then()', () => {
    it('registers resolution handler', async () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      await promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('registers multiple resolution handlers', async () => {
      let callCount = 0;
      let resolutionHandler = () => callCount++;
      let numberOfRegistrations = 3;
      let promise = new PromiseKeeper((resolve) => resolve());
      
      for(let i = 0; i < numberOfRegistrations; i++) {
        promise.then(resolutionHandler);
      }
      await pause();
      expect(callCount).to.equal(numberOfRegistrations);
    });
        
    it('registers rejection handler', async () => {
      let promise = new PromiseKeeper((resolve, reject) => reject(rejectionReason));
      await promise.then(undefined, (reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });

    it('registers multiple rejection handlers', async () => {
      let callCount = 0;
      let rejectionHandler = () => callCount++;
      let numberOfRegistrations = 3;
      let promise = new PromiseKeeper((resolve, reject) => reject());
      
      for(let i = 0; i < numberOfRegistrations; i++) {
        promise.then(null, rejectionHandler);
      }
      await pause();
      expect(callCount).to.equal(numberOfRegistrations);
    });
        
    it('returns a PromiseKeeper instance', () => {
      let promise = new PromiseKeeper((resolve) => resolve());
      let thenPromise = promise.then(() => {});
      expect(thenPromise).to.be.an.instanceof(PromiseKeeper);
    });
    
    it('pushes execution of handlers to the end of the current tick when the promise settles', async () => {
      let promises = [['resolve'], ['reject', [undefined]]].map(([method, thenParams = []]) => {
        return new PromiseKeeper(async (resolve) => {
          let promise = PromiseKeeper[method](resolutionValue);
          thenParams.push((value) => result = value)
          promise.then(...thenParams);
          expect(result).to.be.undefined;
          await pause();
          expect(result).to.equal(resolutionValue);
          resolve();
        });
      });

      await PromiseKeeper.all(promises);
    });

    it('moves invocation of handlers that were added after promise resolution to end of the jobs queue', async () => {
      let promises = [['resolve'], ['reject', [undefined]]].map(([method, thenParams = []]) => {
        return new PromiseKeeper(async (resolve) => {
          let promise = PromiseKeeper[method](resolutionValue);
          await pause();
          thenParams.push((value) => result = value);
          promise.then(...thenParams);
          expect(result).to.be.undefined;
          await pause();
          expect(result).to.equal(resolutionValue);
          resolve();
        });
      });
      
      await PromiseKeeper.all(promises);
    });
    
    it('passes handler-thrown error to rejection handler', async () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      await promise.then((value) => {throw value;}).catch((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });
    
    it('consoles a warning when no handler is provided for handler error', async () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      promise.then((result) => {throw result;});
      await pause();
      expect(warningMessage).to.equal(makeUnhandledRejectionWarning(resolutionValue));
    });

    it('outputs a warning when no handler is provided in a chain of thens/catches', async () => {
      let error = new Error('rejected');
      let promise = new PromiseKeeper(() => {throw error});
      promise.then((result) => {throw result;}).catch().then().catch().then();
      await pauseMs();
      expect(warningMessage).to.equal(makeUnhandledRejectionWarning(error));
    });

    it('channels resolved result through multiple thens', async () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      await promise.then().then().then().then().then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('passes resolved result through multiple then/catches', async () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue)); 
      await promise.then().then().then().catch().catch().then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('changes resolved value in one of the "links" and passes it along', async () => {
      let p1 = new PromiseKeeper((resolve) => resolve(resolutionValue));
      let p2 = p1.then().then().then((value) => value + 1).then()
      await p2.catch().then((value) => result = value);
      expect(result).to.equal(resolutionValue + 1);
    });

    it('throughputs rejected reason through multiple thens/catches', async () => {
      let promise = new PromiseKeeper((resolve, reject) => reject(rejectionReason));        
      await promise.then().then().catch().catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });

    it('handshakes resolved promise returned from then', async () => {
      let p1 = new PromiseKeeper((resolve) => resolve(resolutionValue));
      let p2 = p1.then((value) => new PromiseKeeper((resolve) => resolve(value)))
      await p2.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('handshakes rejected promise returned from then', async () => {
      let p1 = new PromiseKeeper((resolve) => resolve(resolutionValue));
      let p2 = p1.then((value) => new PromiseKeeper((resolve, reject) => reject(value)));
      await p2.catch((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });
  });
});
