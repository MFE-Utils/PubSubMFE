import { PubSubMFE } from "./PubSubMFE";

/**
 * Here are some examples for how to use PubSubMFE
 */

// Create a new instance of PubSubMFE
const pubSub = new PubSubMFE();

// Example 1: Subscribing to all updates
const sub1 = pubSub.get("username").subscribe((name) => {
  console.log("Subscriber 1 (All Updates): ", name);
});

// Example 2: Subscribing to updates with an age greater than 30
pubSub.get("username").subscribe(
  (name) => {
    console.log("Subscriber 2: (Over 30)", name);
  },
  {
    filter: (data) => data.age >= 30
  }
);

// Example 3: Subscribing to updates with an age less than 30
pubSub.get("username").subscribe(
  (name) => {
    console.log("Subscriber 3: (Less 30)", name);
  },
  {
    filter: (data) => data.age < 30
  }
);

// Example 4: Subscribing to all updates at a much later date
setTimeout(() => {
  pubSub.get("username").subscribe((name) => {
    console.log("Subscriber 4 (DELAYED): ", name);
  });
}, 5000);

// Set the initial state of the "username" store
setTimeout(() => {
  pubSub.setState("username", { id: 1, name: "Albert", age: 55 });
}, 0);

// Update the "username" store with a new value after 1 second
setTimeout(() => {
  pubSub.setState("username", { id: 2, name: "Bethany", age: 25 });
}, 1000);

// Update the "username" store with a new value after 2 seconds
setTimeout(() => {
  pubSub.setState("username", { id: 3, name: "Charles", age: 75 });
}, 2000);

// Update the "username" store with a new value after 3 seconds
setTimeout(() => {
  pubSub.setState("username", { id: 4, name: "Dax", age: 18 });
}, 3000);

