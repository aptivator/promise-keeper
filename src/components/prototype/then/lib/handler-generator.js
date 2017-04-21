export default (handler, resolver, rejector) => {
  return value => {
    if(typeof handler === 'function') {
      try {
        value = handler(value);
      } catch(e) {
        return rejector(e);
      }
    }
    
    resolver(value);
  };
};
