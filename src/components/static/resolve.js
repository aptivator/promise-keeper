import PromiseKeeper from '../constructor';

export default value => new PromiseKeeper(resolver => resolver(value));
