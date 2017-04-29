let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');

describe('all()', function() {
  this.timeout(1000);
  
  it('returns an array of results from an array of promises', done => {
    let promise1 = new PromiseKeeper(resolve => setTimeout(() => resolve(25), 10));
    let promise2 = new PromiseKeeper(resolve => setTimeout(() => resolve(25), 50));
    let promise3 = new PromiseKeeper(resolve => setTimeout(() => resolve(25), 25));
    
    PromiseKeeper.all([promise1, promise2, promise3]).then(results => {
      expect(results).to.eql([25, 25, 25]);
      done();
    });
  });
  
  it('returns reason if a promise fails', done => {
    let promise1 = new PromiseKeeper(resolve => setTimeout(() => resolve(25), 10));
    let promise2 = new PromiseKeeper(resolve => setTimeout(() => resolve(25), 50));
    let promise3 = new PromiseKeeper((resolve, reject) => setTimeout(() => reject('rejected'), 25));
    
    PromiseKeeper.all([promise1, promise2, promise3]).then(results => {
      throw new Error('should not happen');
    }, reason => {
      expect(reason).to.equal('rejected');
      done();
    });
  });
});
