import emptyPromiser from '../../lib/empty-promiser';

export default promises => {
  let results = [];
  let {length} = promises || [];
  let fulfilledCount = 0;
  let [promise, resolver, rejector] = emptyPromiser();
  
  promises.forEach((promise, index) => {
    promise.then(result => {
      results[index] = result;
      if(++fulfilledCount === length) {
        resolver(results);
      }
    }, rejector);
  });
  
  return promise;
};
