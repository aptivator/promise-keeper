const errors = new WeakMap();
const resolveHandlers = new WeakMap();
const rejectHandlers = new WeakMap();
const statuses = new WeakMap();
const values = new WeakMap();
const warningMessage = 'Unhandled promise rejection';
const warningTitle = 'UnhandledPromiseRejectionWarning';

export {
  errors,
  resolveHandlers,
  rejectHandlers,
  statuses,
  values,
  warningMessage,
  warningTitle
};
