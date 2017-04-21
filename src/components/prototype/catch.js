export default function(rejectHandler) {
  return this.then(undefined, rejectHandler);  
}
