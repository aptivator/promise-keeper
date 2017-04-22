let PromiseKeeper = require('../dist/promise-keeper');
let {expect} = require('chai');

let c = console.log.bind(console);

describe('promise-keeper', function() {
  this.timeout(500);
  it('tests', done => {
    Promise.reject('rejected');
    PromiseKeeper.reject('rejected');
    setTimeout(() => done(), 400);
  });  
});
