import {expect}        from 'chai';
import {PromiseKeeper} from '../../src/promise-keeper';

describe('race()', function() {
  this.timeout(1000);
  
  it('returns result of first resolved promise', done => {
    let promise1 = new PromiseKeeper(resolve => setTimeout(() => resolve(25), 10));
    let promise2 = new PromiseKeeper(resolve => setTimeout(() => resolve(35), 50));
    let promise3 = new PromiseKeeper(resolve => setTimeout(() => resolve(45), 25));
    
    PromiseKeeper.race([promise1, promise2, promise3]).then(result => {
      expect(result).to.equal(25);
      done();
    });
  });
  
  it('returns rejection if it occurs first', done => {
    let promise1 = new PromiseKeeper((resolve, reject) => setTimeout(() => reject('rejected'), 10));
    let promise2 = new PromiseKeeper(resolve => setTimeout(() => resolve(35), 50));
    let promise3 = new PromiseKeeper(resolve => setTimeout(() => resolve(45), 25));
    
    PromiseKeeper.race([promise1, promise2, promise3]).then(result => {
      throw new Error('should not happen');
    }).catch(reason => {
      expect(reason).to.equal('rejected');
      done();
    });    
  });
  
  it('skips rigestering handlers if one of the promises is already fulfilled', done => {
    let promise1 = PromiseKeeper.resolve(22);
    let promise2 = new PromiseKeeper(resolve => setTimeout(() => resolve(35), 50));
    let promise3 = new PromiseKeeper(resolve => setTimeout(() => resolve(45), 25));
    
    setTimeout(() => {
      PromiseKeeper.race([promise1, promise2, promise3]).then(result => {
        expect(result).to.equal(22);
        done();
      });
    }, 10);
  });
});
