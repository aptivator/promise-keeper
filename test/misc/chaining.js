let sinon = require('sinon');
let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');
let warn;
let stub;

describe('chaining', function() {
  this.timeout(1000);

  before(() => {
    ({warn} = console);
    console.warn = (...args) => {};
    stub = sinon.stub(console, 'warn');
  });

  after(() => {
    console.warn = warn;
  });
  
  it('passes resolved result through multiple thens', done => {
    let promise = new PromiseKeeper(resolve => {
      setTimeout(() => resolve('resolved'));
    });
    
    promise.then().then().then().then().then().then().then().then(result => {
      expect(result).to.equal('resolved');
      done();
    });
  });
  
  it('passes rejected resolve through multiple thens/catches', done => {
    let promise = new PromiseKeeper((resolve, reject) => {
      setTimeout(() => reject('rejected'));
    });    
    
    promise.then().then().then().catch().then().catch().catch().then(null, reason => {
      expect(reason).to.equal('rejected');
      done();
    });
  });
  
  it('prints a warning when no handler is provided in a long chain of thens/catches', done => {
    let promise = new PromiseKeeper(resolve => {
      throw new Error('rejected');
    });
    
    promise.then(result => {
      throw result;
    }).then().then().then().catch().catch().then().then().catch();
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.match(/^UnhandledPromiseRejectionWarning/);
      done();
    }, 20);
  });
  
  it('requires resolution handler if catch handler returns non-error value', done => {
    let promise = new PromiseKeeper(resolve => {
      throw 'rejected';
    });
    
    promise.catch(reason => 22).then(result => {
      expect(result).to.equal(22);
      done();
    }, () => {
      throw new Error('should not happen');
    });
  });
});
