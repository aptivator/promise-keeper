export default (handler, resolver, rejector) => {
  let isRejector = resolver === rejector;
  return value => {
    if(typeof handler === 'function') {
      try {
        value = handler(value);
      } catch(e) {
        return rejector(e, true);
      }
    }
    
    resolver(value, isRejector);
  };
};
