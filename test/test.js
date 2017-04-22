let PromiseKeeper = require('../dist/promise-keeper');
let {expect} = require('chai');

let c = console.log.bind(console);

describe('promise-keeper', function() {
  this.timeout(500);
  it('tests', done => {
    let promise = new PromiseKeeper(resolve => resolve(PromiseKeeper.reject('rejected')));
    promise.catch(m => PromiseKeeper.reject(m)).catch(c);
    setTimeout(() => done(), 400);
  });  
});
