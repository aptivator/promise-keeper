import {PromiseKeeper}                    from '../promise-keeper';
import {aggregateErrorMessage}            from './vars';
import {unhandledRejectionWarningMessage} from './vars';

export function getAggregateError(errors) {
  return new AggregateError(errors, aggregateErrorMessage);
}

export function getPromiseParts() {
  let resolve, reject;
  let promise = new PromiseKeeper((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  
  return {promise, resolve, reject};
}

export function unhandledRejectionWarning(reason) {
  console.warn(`${unhandledRejectionWarningMessage} (reason: ${reason})`);
}
