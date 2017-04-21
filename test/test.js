let PromiseKeeper = require('../dist/promise-keeper');
let {expect} = require('chai');

let c = console.log.bind(console);

describe('promise-keeper', () => {
  it('tests', done => {
    let promise = new PromiseKeeper(resolve => resolve(25));
    promise.then(n => {throw n;}).then(n => {throw n;}).then(n => {throw n;}).then(n => {throw n;}).then(c, c).then(() => done());
  });  
});
