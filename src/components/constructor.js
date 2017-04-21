import resolver from './internal/resolver';
import rejector from './internal/rejector';

import {resolveHandlers, rejectHandlers} from '../lib/vars';

export default function(body) {
  rejectHandlers.set(this, []);
  resolveHandlers.set(this, []);
  body(resolver.bind(this), rejector.bind(this));
}
