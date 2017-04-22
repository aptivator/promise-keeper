let PromiseKeeper = require('../dist/promise-keeper');
let {expect} = require('chai');

let c = console.log.bind(console);

describe('promise-keeper', function() {
  this.timeout(3200);
  it('tests', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve(new PromiseKeeper(resolve => {
        resolve(new PromiseKeeper(resolve => {
          throw new Error('inner inner reject');
        }));
        
        throw new Error('inner reject');
      }));
      
      throw new Error('reject');
    });

    promise.catch(e => console.log(e.message));
    
    setTimeout(() => done(), 400);
  });  
});

