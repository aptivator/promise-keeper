export default (executor, obj) => 
  value => {
    if(obj.fulfilled) {
      return;
    }    
    
    obj.fulfilled = true;
    executor(value);
  };
