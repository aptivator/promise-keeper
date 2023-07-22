import sinon           from 'sinon';
import {expect}        from 'chai';
import {PromiseKeeper} from '../src/promise-keeper';

describe('Miscellaneous', () => {
  describe('Promise Chaining', () => {
    let warn;
    let stub;
  
    beforeEach(() => {
      ({warn} = console);
      console.warn = () => {};
      stub = sinon.stub(console, 'warn');
    });
  
    afterEach(() => console.warn = warn);
    
    it('channels resolved result through multiple thens', (done) => {
      let promise = new PromiseKeeper((resolve) => {
        setTimeout(() => resolve('resolved'));
      });
      
      promise.then().then().then().then().then((result) => {
        expect(result).to.equal('resolved');
        done();
      });
    });
    
    it('passes resolved result through multiple then/catches', (done) => {
      let promise = new PromiseKeeper((resolve) => {
        setTimeout(() => resolve('resolved'));
      });    
      
      promise.then().then().then().catch().catch().then((result) => {
        expect(result).to.equal('resolved');
        done();
      });    
    });
    
    it('changes resolved value in one of the "links" and passes it along', (done) => {
      let promise = new PromiseKeeper((resolve) => {
        setTimeout(() => resolve('resolved'));
      });
      
      promise.then().then().then((result) => result + 1).then().catch().then((result) => {
        expect(result).to.equal('resolved1');
        done();
      });
    });

    it('throughputs rejected reason through multiple thens/catches', (done) => {
      let promise = new PromiseKeeper((resolve, reject) => {
        setTimeout(() => reject('rejected'));
      });    
      
      promise.then().then().then().catch().catch().catch((reason) => {
        expect(reason).to.equal('rejected');
        done();
      });
    });
  });

  describe('Promise Handshaking', function() {
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
      
      promise.then(undefined, reason => {
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
});
