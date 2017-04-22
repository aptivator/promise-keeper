let PromiseKeeper = require('../dist/promise-keeper');
let {expect} = require('chai');

let c = console.log.bind(console);

describe('promise-keeper', function() {
  this.timeout(3200);
  it('tests', done => {
    let promise = new PromiseKeeper(resolve => {
      resolve(new PromiseKeeper(resolve => {
        resolve(new PromiseKeeper((resolve, reject) => {
          reject('reject');
          resolve(22);
        }));
      }));
    });
    
    promise.then(c, c).catch(c);
    
    setTimeout(() => done(), 400);
  });  
});
