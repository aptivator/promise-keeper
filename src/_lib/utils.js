import {aggregateErrorMessage}            from './vars';
import {unhandledRejectionWarningMessage} from './vars';

export function getAggregateError(errors) {
  return new AggregateError(errors, aggregateErrorMessage);
}

export function makeUnhandledRejectionWarning(reason) {
  return `${unhandledRejectionWarningMessage} (reason: ${reason})`;
}

export function unhandledRejectionWarning(reason) {
  let warning = makeUnhandledRejectionWarning(reason);
  console.warn(warning);
}
