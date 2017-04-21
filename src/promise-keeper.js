import PromiseKeeper from './components/constructor';
import catcher       from './components/prototype/catch';
import then          from './components/prototype/then/then';
import all           from './components/static/all';
import race          from './components/static/race/race';
import reject        from './components/static/reject';
import resolve       from './components/static/resolve';

Object.assign(PromiseKeeper.prototype, {catch: catcher, then});
Object.assign(PromiseKeeper, {all, race, reject, resolve});

export default PromiseKeeper;
