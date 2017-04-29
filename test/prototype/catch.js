let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');

describe('catch()', function() {
  this.timeout(1000);
  
  it('registers rejection handler', done => {
    let promise = new PromiseKeeper((resolve, reject) => {
      reject('rejected');
    });
    
    promise.catch(reason => {
      expect(reason).to.equal('rejected');
      done();
    });
  });
});
