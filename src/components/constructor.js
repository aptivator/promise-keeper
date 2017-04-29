import executor from './executor/executor';
import {errors, resolveHandlers, rejectHandlers} from '../lib/vars';

export default function(body) {
  rejectHandlers.set(this, []);
  resolveHandlers.set(this, []);
  let resolver = value => executor.call(this, value);
  let rejector = reason => executor.call(this, reason, true);
  
  try {
    body(resolver, rejector);
  } catch(e) {
    let timeout = setTimeout(() => rejector(e));
    errors.set(this, {timeout, e});
  }
}
