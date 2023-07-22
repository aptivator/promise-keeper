import {expect}                from 'chai';
import {aggregateErrorMessage} from '../src/_lib/vars';
import {PromiseKeeper}         from '../src/promise-keeper';

describe('static methods', () => {
  describe('all()', () => {
    it('returns an ordered array of results from an array of promises', (done) => {
      let promise1 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 1));
      let promise2 = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      let promise3 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 3));
      let promises = [promise1, promise2, promise3];
      
      PromiseKeeper.all(promises).then((results) => {
        expect(results).to.eql([1, 2, 3]);
        done();
      });
    });
    
    it('returns reason if a promise fails', (done) => {
      let promise1 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      let promise2 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      let promise3 = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, 'rejected'));
      let promises = [promise1, promise2, promise3];
      
      PromiseKeeper.all(promises).then(() => {
        throw new Error('should not happen');
      }, (reason) => {
        expect(reason).to.equal('rejected');
        done();
      });
    });
  });
  
  describe('allSettled()', () => {
    it('returns an array of object results from an array of settled promises', (done) => {
      let promise1 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 10));
      let promise2 = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, 'rejected'));
      let promise3 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 25));
      let promises = [promise1, promise2, promise3];
      
      PromiseKeeper.allSettled(promises).then((results) => {
        expect(results).to.eql([
          {status: 'fulfilled', value: 10},
          {status: 'rejected', reason: 'rejected'},
          {status: 'fulfilled', value: 25}
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
    it('returns first fulfilled promise value', (done) => {
      let promise1 = new PromiseKeeper((resolve) => resolve(25));
      let promise2 = new PromiseKeeper((resolve, reject) => reject('rejected'));
      let promise3 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 10));
      let promises = [promise1, promise2, promise3];

      PromiseKeeper.any(promises).then((result) => {
        expect(result).to.equal(25);
        done();
      });
    });

    it('errors with AggregateError when all promises reject', (done) => {
      let promise1 = new PromiseKeeper((resolve, reject) => setTimeout(reject, 10, 25));
      let promise2 = new PromiseKeeper((resolve, reject) => reject('rejected'));
      let promise3 = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, 10));
      let promises = [promise1, promise2, promise3];

      PromiseKeeper.any(promises).catch((reason) => {
        expect(reason instanceof AggregateError).to.be.true;
        expect(reason.message).to.equal(aggregateErrorMessage);
        expect(reason.errors).to.eql([25, 'rejected', 10]);
        done();
      });
    });

    it('rejects with an empty AggregateError when no promises are provided', (done) => {
      PromiseKeeper.any([]).catch((reason) => {
        expect(reason.errors).to.eql([]);
        done();
      });
    });

    it('defaults to an empty array if no parameter is provided', (done) => {
      PromiseKeeper.any().catch((reason) => {
        expect(reason.errors).to.eql([]);
        done();
      });
    });
  });

  describe('race()', () => {
    it('returns result of first resolved promise', (done) => {
      let promise1 = new PromiseKeeper((resolve) => setTimeout(resolve, 20, 1));
      let promise2 = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      let promise3 = new PromiseKeeper((resolve) => setTimeout(resolve, 0, 3));
      let promises = [promise1, promise2, promise3];
      
      PromiseKeeper.race(promises).then((result) => {
        expect(result).to.equal(3);
        done();
      });
    });
    
    it('returns rejection if it occurs first', (done) => {
      let promise1 = new PromiseKeeper((resolve) => setTimeout(resolve, 20, 1));
      let promise2 = new PromiseKeeper((resolve) => setTimeout(resolve, 10, 2));
      let promise3 = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, 'rejected'));
      let promises = [promise1, promise2, promise3];

      PromiseKeeper.race(promises).then(() => {
        throw new Error('should not happen');
      }).catch((reason) => {
        expect(reason).to.equal('rejected');
        done();
      });    
    });
  });

  describe('reject()', () => {
    it('returns a rejected promise', (done) => {
      let promise = PromiseKeeper.reject('rejected');
  
      promise.then(null, (reason) => {
        expect(reason).to.equal('rejected');
        setTimeout(done, 10);
      });
    });
  });
  
  describe('resolve()', function() {
    it('returns a resolved promise', (done) => {
      let promise = PromiseKeeper.resolve('resolved');
      promise.then((result) => {
        expect(result).to.equal('resolved');
        done();
      });
    });
  });
});
