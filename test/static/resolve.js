let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');

describe('resolve()', function() {
  this.timeout(1000);
  
  it('returns a resolved promise', done => {
    let promise = PromiseKeeper.resolve('resolved');
    promise.then(result => {
      expect(result).to.equal('resolved');
      done();
    });
  });
});
