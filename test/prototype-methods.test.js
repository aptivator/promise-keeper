import sinon           from 'sinon';
import {expect}        from 'chai';
import {PromiseKeeper} from '../src/promise-keeper';

describe('prototype methods', () => {
  describe('catch()', () => {
    it('registers rejection handler', (done) => {
      let promise = new PromiseKeeper((resolve, reject) => {
        reject('rejected');
      });
      
      promise.catch((reason) => {
        expect(reason).to.equal('rejected');
        done();
      });
    });

    it('requires resolution handler if catch handler returns non-error value', done => {
      let promise = new PromiseKeeper(() => {
        throw 'rejected';
      });
      
      promise.catch(() => 22).then(() => {
        throw new Error('should not happen');
      }, (result) => {
        expect(result).to.equal(22);
        done();
      });
    });
  });

  describe('finally()', () => {
    it('triggers finally callback after the promise is resolved', (done) => {
      let promise = new PromiseKeeper(resolve => setTimeout(resolve, 0, 22));
      
      promise.then((result) => {
        expect(result).to.equal(22);
      }).finally(done);
    });
    
    it('triggers finally callback after the promise is rejected', (done) => {
      let promise = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, 'rejected'));
      
      promise.catch((reason) => {
        expect(reason).to.equal('rejected');
      }).finally(done);
    });
    
    it('passes no parameters to the callback', (done) => {
      let promise = PromiseKeeper.resolve('resolved');
      
      promise.then((result) => {
        expect(result).to.equal('resolved');
        return result;
      }).finally((result) => {
        expect(result).to.be.undefined;
        done();
      });
    });
  });

  describe('then()', () => {
    it('registers resolution handler', (done) => {
      let promise = new PromiseKeeper((resolve) => {
        resolve('resolved');
      });
      
      promise.then((result) => {
        expect(result).to.equal('resolved');
        done();
      });
    });
    
    it('registers multiple resolution handlers', (done) => {
      let resolutionHandler = sinon.spy();
      let numberOfRegistrations = 3;
      let promise = new PromiseKeeper((resolve) => {
        resolve('resolved');
      });
      
      for(let i = 0; i < numberOfRegistrations; i++) {
        promise.then(resolutionHandler);
      }

      setTimeout(() => {
        expect(resolutionHandler.callCount).to.equal(numberOfRegistrations);
        done();
      });
    });
    
    it('registers rejection handler', (done) => {
      let promise = new PromiseKeeper((resolve, reject) => {
        reject('rejected');
      });
      
      promise.then(undefined, (reason) => {
        expect(reason).to.equal('rejected');
        done();
      });
    });
    
    it('registers multiple rejection handlers', (done) => {
      let rejectionHandler = sinon.spy();
      let numberOfRegistrations = 3;
      let promise = new PromiseKeeper((resolve, reject) => {
        reject('rejected');
      });
      
      for(let i = 0; i < numberOfRegistrations; i++) {
        promise.then(null, rejectionHandler);
      }

      setTimeout(() => {
        expect(rejectionHandler.callCount).to.equal(numberOfRegistrations);
        done();
      });
    });
    
    it('returns a PromiseKeeper instance', () => {
      let promise = new PromiseKeeper(resolve => {
        resolve('resolved');
      });
      
      let thenPromise = promise.then(() => {});
      
      expect(thenPromise).to.be.an.instanceof(PromiseKeeper);
    });

    it('skips rigestering a handler if a promise is settled', (done) => {
      let promise = PromiseKeeper.resolve(22);
      
      setTimeout(() => {
        promise.then((result) => {
          expect(result).to.equal(22);
          done();
        });
      });
    });
  });  
});
