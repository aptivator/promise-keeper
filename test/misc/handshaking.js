let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');

describe('handshaking', function() {
  this.timeout(1000);

  it('handshakes nested promises in the resolver', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve(new PromiseKeeper(resolve => {
        resolve(new PromiseKeeper(resolve => {
          resolve(new PromiseKeeper(resolve => {
            setTimeout(() => resolve('resolved'));
          }));
        }));
      }));
    });
    
    promise.then(result => {
      expect(result).to.equal('resolved');
      done();
    });
  });
  
  it('handshakes nested promises in the rejector', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve(new PromiseKeeper(resolve => {
        resolve(new PromiseKeeper(resolve => {
          resolve(new PromiseKeeper((resolve, reject) => {
            setTimeout(() => reject('rejected'));
          }));
        }));
      }));
    });
    
    promise.then(null, reason => {
      expect(reason).to.equal('rejected');
      done();
    });
  });
  
  it('handshakes resolved promise returned from then', done => {
    let promise = new PromiseKeeper(resolve => resolve('resolved'));
    
    promise.then(result => {
      return new PromiseKeeper(resolve => {
        setTimeout(() => resolve(result));
      });
    }).then(result => {
      expect(result).to.equal('resolved');
      done();
    });
  });
  
  it('handshakes rejected promise returned from then', done => {
    let promise = new PromiseKeeper(resolve => resolve('resolved'));
    
    promise.then(result => {
      return new PromiseKeeper((resolve, reject) => {
        setTimeout(() => reject(result));
      });
    }).then(result => {
      throw new Error('should not happen');
    }).catch(reason => {
      expect(reason).to.equal('resolved');
      done();
    });
  });
});
