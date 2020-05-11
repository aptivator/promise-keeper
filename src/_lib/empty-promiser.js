import {PromiseKeeper} from '../promise-keeper';

export function emptyPromiser() {
  let resolver, rejector;
  let promise = new PromiseKeeper((...args) => {[resolver, rejector] = args});
  return {promise, rejector, resolver};
}
