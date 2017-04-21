import PromiseKeeper from '../components/constructor';

export default () => {
  let resolver, rejector;
  let promise = new PromiseKeeper((...args) => {[resolver, rejector] = args});
  return [promise, resolver, rejector];
};
