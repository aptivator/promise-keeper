import emptyPromiser    from '../../../lib/empty-promiser';
import handlerRegistrar from './lib/handler-registrar';

export default function(resolveHandler, rejectHandler) {
  let [promise, resolver, rejector] = emptyPromiser();
  handlerRegistrar(this, true, resolveHandler, resolver, rejector);
  handlerRegistrar(this, false, rejectHandler, resolver, rejector);
  return promise;
}
