let sinon = require('sinon');
let {expect} = require('chai');
let PromiseKeeper = require('../../dist/promise-keeper');
let warn;
let stub;

describe('error handling', function() {
  this.timeout(1000);

  before(() => {
    ({warn} = console);
    console.warn = (...args) => {};
    stub = sinon.stub(console, 'warn');
  });

  after(() => {
    console.warn = warn;
  });

  it('passes promise-body-thrown error to rejection handler', done => {
    let promise = new PromiseKeeper(resolve => {
      throw new Error('rejected');
    });
    
    promise.catch(e => {
      expect(e.message).to.equal('rejected');
      done();
    });
  });
  
  it('executes promise body on a single thread', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve(new PromiseKeeper(resolve => {
        resolve(new PromiseKeeper(resolve => {
          throw 'inner inner error';
        }));
        throw 'inner error';
      }));
      throw 'error';
    });
    
    promise.catch(e => {
      expect(e).to.equal('inner inner error');
      done();
    });
  });
  
  it('passes handler-thrown error to rejection handler', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve('resolved');
    });
    
    promise.then(result => {
      throw result;
    }).catch(e => {
      expect(e).to.equal('resolved');
      done();
    });
  });
  
  it('prints a warning when no handler is provided for body error', done => {
    new PromiseKeeper(resolve => {
      throw new Error('rejected');
    });
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.match(/^UnhandledPromiseRejectionWarning/);
      done();
    }, 20);
  });
  
  it('prints a warning when no handler is provided for handler error', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve('resolved');
    });
    
    promise.then(result => {
      throw result;
    });
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.match(/^UnhandledPromiseRejectionWarning/);
      done();
    }, 20);
  });
});
