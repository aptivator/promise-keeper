import sinon                              from 'sinon';
import {expect}                           from 'chai';
import {unhandledRejectionWarningMessage} from '../src/_lib/vars';
import {PromiseKeeper}                    from '../src/promise-keeper';

describe('Error Handling', () => {
  let warn;
  let stub;

  beforeEach(() => {
    ({warn} = console);
    console.warn = () => {};
    stub = sinon.stub(console, 'warn');
  });

  afterEach(() => console.warn = warn);

  it('passes promise-body-thrown error to rejection handler', (done) => {
    let promise = new PromiseKeeper(() => {
      throw new Error('rejected');
    });
    
    promise.catch((e) => {
      expect(e.message).to.equal('rejected');
      done();
    });
  });
  
  it('executes promise body on a single thread', (done) => {
    let promise = new PromiseKeeper((resolve) => {
      resolve(new PromiseKeeper((resolve) => {
        resolve(new PromiseKeeper(() => {
          throw 'inner inner error';
        }));
        throw 'inner error';
      }));
      throw 'error';
    });
    
    promise.catch((e) => {
      expect(e).to.equal('inner inner error');
      done();
    });
  });
  
  it('passes handler-thrown error to rejection handler', (done) => {
    let promise = new PromiseKeeper((resolve) => {
      resolve('resolved');
    });
    
    promise.then((result) => {
      throw result;
    }).catch(e => {
      expect(e).to.equal('resolved');
      done();
    });
  });
  
  it('prints a warning when no handler is provided for body error', (done) => {
    new PromiseKeeper(() => {
      throw new Error('rejected');
    });
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.include(unhandledRejectionWarningMessage);
      done();
    });
  });
  
  it('consoles a warning when no handler is provided for handler error', (done) => {
    let promise = new PromiseKeeper((resolve) => resolve('resolved'));
    promise.then((result) => {
      throw result;
    });
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.include(unhandledRejectionWarningMessage);
      done();
    });
  });

  it('outputs a warning when no handler is provided in a chain of thens/catches', (done) => {
    let promise = new PromiseKeeper(() => {
      throw new Error('rejected');
    });
    
    promise.then((result) => {
      throw result;
    }).catch().then().catch();
    
    setTimeout(() => {
      expect(stub.args[0][0]).to.include(unhandledRejectionWarningMessage);
      done();
    });
  });
});
