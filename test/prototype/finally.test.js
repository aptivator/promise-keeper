import {expect}        from 'chai';
import {PromiseKeeper} from '../../src/promise-keeper';

describe('finally()', function() {
  this.timeout(1000);
  
  it('triggers finally callback after the promise is resolved', done => {
    let promise = new PromiseKeeper(resolve => setTimeout(resolve, 0, 22));
    
    promise.then(result => {
      expect(result).to.equal(22);
    }).finally(done);
  });
  
  it('triggers finally callback after the promise is rejected', done => {
    let promise = new PromiseKeeper((resolve, reject) => setTimeout(reject, 0, 'rejected'));
    
    promise.catch(reason => {
      expect(reason).to.equal('rejected');
    }).finally(done);
  });
  
  it('passes no parameters to the callback', done => {
    let promise = PromiseKeeper.resolve('yes');
    
    promise.then(result => {
      expect(result).to.equal('yes');
      return result;
    }).finally(result => {
      expect(result).to.equal(undefined);
      done();
    });
  });
});
