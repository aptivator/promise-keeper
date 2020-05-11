import sinon           from 'sinon';
import {expect}        from 'chai';
import {PromiseKeeper} from '../../src/promise-keeper';

describe('chaining', function() {
  let warn;
  let stub;
  this.timeout(1000);

  beforeEach(() => {
    ({warn} = console);
    console.warn = (...args) => {};
    stub = sinon.stub(console, 'warn');
  });

  afterEach(() => {
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
    
    promise.then().then().then().catch().catch().catch(reason => {
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
    }).catch().catch();
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.match(/^UnhandledPromiseRejectionWarning/);
      done();
    }, 20);
  });
  
  it('requires resolution handler if catch handler returns non-error value', done => {
    let promise = new PromiseKeeper(resolve => {
      throw 'rejected';
    });
    
    promise.catch(reason => 22).catch(result => {
      expect(result).to.equal(22);
      done();
    }, () => {
      throw new Error('should not happen');
    });
  });
});
