import {addTrapDefinitions, createTrapObject} from 'var-trap';

addTrapDefinitions('array', {
  storeFactory: () => [],
  valueAdder: (value, store) => store.push(value),
  methods: {
    clear(store) {
      store.splice(0)
    }
  }
});

export const trap = createTrapObject({a: 'array'});
