import emptyPromiser  from '../../../lib/empty-promiser';
import racerGenerator from './lib/racer-generator';

export default promises => {
  let [promise, resolver, rejector] = emptyPromiser();
  promises.forEach(promise => promise.then(
    racerGenerator(resolver, promises),
    racerGenerator(rejector, promises)
  ));
  
  return promise;
};
