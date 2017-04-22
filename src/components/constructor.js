import executor from './executor';
import {resolveHandlers, rejectHandlers} from '../lib/vars';

export default function(body) {
  rejectHandlers.set(this, []);
  resolveHandlers.set(this, []);
  let resolver = value => executor.call(this, value);
  let rejector = reason => executor.call(this, reason, true);
  body(resolver, rejector);
}
