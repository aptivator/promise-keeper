let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');

describe('reject()', function() {
  this.timeout(1000);
  
  it('returns a rejected promise', done => {
    let promise = PromiseKeeper.reject('rejected');
    promise.then(null, reason => {
      expect(reason).to.equal('rejected');
      done();
    });
  });
});
