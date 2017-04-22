let PromiseKeeper = require('../dist/promise-keeper');
let {expect} = require('chai');

let c = console.log.bind(console);

describe('promise-keeper', function() {
  this.timeout(500);
  it('tests', done => {
    let promise = new PromiseKeeper(resolve => resolve(25));
    promise.then(n => {throw n;}).then(c, n => {throw n;}).catch(n => {throw n;}).then().then().then().then();
    
    setTimeout(() => done(), 400);
  });  
});
