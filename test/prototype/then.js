let sinon = require('sinon');
let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');

describe('then()', function() {
  this.timeout(1000);
  
  it('registers resolution handler', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve('resolved');
    });
    
    promise.then(result => {
      expect(result).to.equal('resolved');
      done();
    });
  });
  
  it('registers multiple resolution handlers', done => {
    let resolutionHandler = sinon.spy();
    let promise = new PromiseKeeper(resolve => {
      resolve('resolved');
      setTimeout(() => {
        expect(resolutionHandler.callCount).to.equal(3);
        done();
      });
    });
    
    promise.then(resolutionHandler);
    promise.then(resolutionHandler);
    promise.then(resolutionHandler);
  });
  
  it('registers rejection handler', done => {
    let promise = new PromiseKeeper((resolve, reject) => {
      reject('rejected');
    });
    
    promise.then(null, reason => {
      expect(reason).to.equal('rejected');
      done();
    });
  });
  
  it('registers multiple rejection handlers', done => {
    let rejectionHandler = sinon.spy();
    let promise = new PromiseKeeper((resolve, reject) => {
      reject('rejected');
      setTimeout(() => {
        expect(rejectionHandler.callCount).to.equal(3);
        done();
      });
    });
    
    promise.then(null, rejectionHandler);
    promise.then(null, rejectionHandler);
    promise.then(null, rejectionHandler);
  });
  
  it('returns a PromiseKeeper instance', () => {
    let promise = new PromiseKeeper(resolve => {
      resolve('resolved');
    });
    
    let thenPromise = promise.then(result => {});
    
    expect(thenPromise).to.be.an.instanceof(PromiseKeeper);
  });
});
