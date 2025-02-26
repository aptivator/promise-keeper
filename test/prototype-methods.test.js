import {expect}                           from 'chai';
import {makeUnhandledRejectionWarning}    from '../src/_lib/utils';
import {PromiseKeeper}                    from '../src/promise-keeper';
import {rejectionReason, resolutionValue} from './_lib/vars';

describe('prototype methods', () => {
  let result;
  let warn;
  let warningMessage;

  before(() => {
    ({warn} = console);
    console.warn = (message) => warningMessage = message;
  });
  afterEach(() => result = undefined);
  after(() => Object.assign(console, {warn}));

  describe('constructor', () => {
    it('creates an instance of PromiseKeeper that gives resolver and rejector to its callback', () => {
      new PromiseKeeper((resolve, reject) => result = [typeof resolve, typeof reject]);
      expect(result).to.eql(Array(2).fill('function'));
    });

    it('prints a warning when no handler is provided for a promise body error', (done) => {
      let error = new Error('rejected');
      new PromiseKeeper(() => {throw error;});
      
      setTimeout(() => {
        let generatedWarningMessage = makeUnhandledRejectionWarning(error);
        expect(warningMessage).to.include(generatedWarningMessage);
        done();
      });
    });

    it('passes promise-body-thrown error to rejection handler', () => {
      let error = 'rejected';
      let promise = new PromiseKeeper(() => {throw new Error(error)});
      promise.catch((reason) => result = reason);
      expect(result.message).to.equal(error);
    });
  });

  describe('promise body resolve()', () => {
    it(`connects a passed promise value to to its own's promise's fulfillment mechanism`, () => {
      let promise = new PromiseKeeper((resolve) => {
        let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
        resolve(promise);
      });

      promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('prioritizes the first promise-body-thrown error', () => {
      let promise = new PromiseKeeper((resolve) => {
        resolve(new PromiseKeeper((resolve) => {
          resolve(new PromiseKeeper(() => {
            throw 'nested error';
          }));
          throw 'inner error';
        }));
        throw 'error';
      });
      
      promise.catch((reason) => result = reason);
      expect(result).to.equal('nested error');
    });
  });

  describe('promise body reject()', () => {
    it(`connects a passed promise value to to its own's promise's fulfillment mechanism`, () => {
      let promise = new PromiseKeeper((resolve, reject) => {
        let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
        reject(promise);
      });

      promise.catch((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });

    it('prioritizes the first promise-body-thrown error', () => {
      let promise = new PromiseKeeper((resolve, reject) => {
        reject(new PromiseKeeper((resolve, reject) => {
          reject(new PromiseKeeper(() => {
            throw 'nested error';
          }));
          throw 'inner error';
        }));
        throw 'error';
      });
      
      promise.catch((reason) => result = reason);
      expect(result).to.equal('nested error');
    });
  });

  describe('catch()', () => {
    it('registers rejection handler', () => {
      let reason = 'rejected';
      let promise = new PromiseKeeper((resolve, reject) => reject(reason));
      promise.catch((reason) => result = reason);
      expect(result).to.equal(reason);
    });

    it('requires resolution handler if catch handler returns non-error value', () => {
      let promise = new PromiseKeeper(() => {throw '';});
      promise.catch(() => resolutionValue).then((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });

    it('picks up an error thrown in a rejection handler', () => {
      let promise = new PromiseKeeper(() => {throw '';});
      promise.catch(() => {throw rejectionReason;}).catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });

    it('generates a warning if an error thrown in a rejection handler is not picked up', (done) => {
      let promise = new PromiseKeeper(() => {throw '';});
      promise.catch(() => {throw rejectionReason;});
      
      setTimeout(() => {
        expect(warningMessage).to.equal(makeUnhandledRejectionWarning(rejectionReason));
        done();
      });
    });
  });

  describe('finally()', () => {
    it('triggers finally callback after the promise is resolved', (done) => {
      let promise = new PromiseKeeper((resolve) => {
        setTimeout(resolve, 0, resolutionValue);
      });
      
      promise.then((value) => result = value).finally(() => {
        expect(result).to.equal(resolutionValue);
        done(); 
      });
    });

    it('invokes finally callback after the promise is rejected', (done) => {
      let promise = new PromiseKeeper((resolve, reject) => {
        setTimeout(reject, 0, rejectionReason);
      });
      
      promise.catch((reason) => {
        expect(reason).to.equal(rejectionReason);
      }).finally(done);
    });

    it('passes no parameters to the callback', (done) => {
      let promise = PromiseKeeper.resolve(resolutionValue);
      
      promise.then((result) => {
        expect(result).to.equal(resolutionValue);
        return result;
      }).finally((result) => {
        expect(result).to.be.undefined;
        done();
      });
    });
  });

  describe('then()', () => {
    it('registers resolution handler', () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });
    
    it('registers multiple resolution handlers', () => {
      let callCount = 0;
      let resolutionHandler = () => callCount++;
      let numberOfRegistrations = 3;
      let promise = new PromiseKeeper((resolve) => resolve());
      
      for(let i = 0; i < numberOfRegistrations; i++) {
        promise.then(resolutionHandler);
      }
       
      expect(callCount).to.equal(numberOfRegistrations);
    });
    
    it('registers rejection handler', () => {
      let promise = new PromiseKeeper((resolve, reject) => reject(rejectionReason));
      promise.then(undefined, (reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });
    
    it('registers multiple rejection handlers', () => {
      let callCount = 0;
      let rejectionHandler = () => callCount++;
      let numberOfRegistrations = 3;
      let promise = new PromiseKeeper((resolve, reject) => reject());
      
      for(let i = 0; i < numberOfRegistrations; i++) {
        promise.then(null, rejectionHandler);
      }

      expect(callCount).to.equal(numberOfRegistrations);
    });
    
    it('returns a PromiseKeeper instance', () => {
      let promise = new PromiseKeeper((resolve) => resolve());
      let thenPromise = promise.then(() => {});
      expect(thenPromise).to.be.an.instanceof(PromiseKeeper);
    });

    it('skips rigestering and instead executes a handler if promise resolution is on the same execution thread', () => {
      let promise = PromiseKeeper.resolve(resolutionValue);
      promise.then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('passes handler-thrown error to rejection handler', () => {
      let resolveValue = 'resolved';
      let promise = new PromiseKeeper((resolve) => resolve(resolveValue));
      promise.then((value) => {throw value;}).catch((reason) => result = reason);
      expect(result).to.equal(resolveValue);
    });

    it('consoles a warning when no handler is provided for handler error', (done) => {
      let resolveValue = 'resolved';
      let promise = new PromiseKeeper((resolve) => resolve(resolveValue));
      promise.then((result) => {throw result;});
      
      setTimeout(() => {
        let generatedWarningMessage = makeUnhandledRejectionWarning(resolveValue);
        expect(generatedWarningMessage).to.equal(warningMessage);
        done();
      });
    });

    it('outputs a warning when no handler is provided in a chain of thens/catches', (done) => {
      let error = new Error('rejected');
      let promise = new PromiseKeeper(() => {throw error});
      promise.then((result) => {throw result;}).catch().then().catch().then();
      
      setTimeout(() => {
        let generatedWarningMessage = makeUnhandledRejectionWarning(error);
        expect(generatedWarningMessage).to.equal(warningMessage);
        done();
      });
    });

    it('channels resolved result through multiple thens', () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      promise.then().then().then().then().then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('passes resolved result through multiple then/catches', () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue)); 
      promise.then().then().then().catch().catch().then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('changes resolved value in one of the "links" and passes it along', () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      promise.then().then().then((value) => value + 1).then().catch().then((value) => result = value);
      expect(result).to.equal(resolutionValue + 1);
    });

    it('throughputs rejected reason through multiple thens/catches', () => {
      let promise = new PromiseKeeper((resolve, reject) => reject(rejectionReason));        
      promise.then().then().catch().catch((reason) => result = reason);
      expect(result).to.equal(rejectionReason);
    });

    it('handshakes resolved promise returned from then', () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      promise.then((value) => new PromiseKeeper((resolve) => resolve(value))).then((value) => result = value);
      expect(result).to.equal(resolutionValue);
    });

    it('handshakes rejected promise returned from then', () => {
      let promise = new PromiseKeeper((resolve) => resolve(resolutionValue));
      promise.then((value) => new PromiseKeeper((resolve, reject) => reject(value))).catch((reason) => result = reason);
      expect(result).to.equal(resolutionValue);
    });
  });
});
