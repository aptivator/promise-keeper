import {unhandledRejectionWarning} from './vars';

export default {
  unhandledRejectionWarning(reason) {
    console.warn(`${unhandledRejectionWarning} (reason: ${reason})`);
  } 
};
