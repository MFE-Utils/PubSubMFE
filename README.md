# PubSubMFE

PubSubMFE (Publish Subscribe Micro Frontend) is a flexible and efficient publish-subscribe pattern implementation in JavaScript. It is useful for decoupling components in a Micro Frontend Architecture and other systems where loose coupling between components is desired.

## Installation
`npm i @mfe-utils/pubsubmfe`


## Usage

First, import PubSubMFE:


`import { PubSubMFE } from '@mfe-utils/pubsubmfe';` 

Create a new instance of PubSubMFE. You can use the default options, or provide an options object:

    const pubSub = new PubSubMFE();
    
    // or with options
    const pubSubWithOptions = new PubSubMFE({
      storeMap: new Map(),
      ObservableConfig: { /* DataObservable configuration here */ }
    }); 

The optional parameters for the PubSubMFE object are:

-   `storeMap`: A `Map` object to use as the store instead of the build in static class. 
    
-   `ObservableConfig`: An object containing configuration options for the DataObservables created by the instance. The actual options depend on the DataObservable implementation. *See the notes on the ObservableConfig below*
    

### Basic Publish and Subscribe

A basic publish and subscribe flow looks like this:

    // create a subscriber
    pubSub.get('channel1').subscribe((data) => console.log('Received:', data));
    
    // publish some data
    pubSub.get('channel1').publish('Hello, world!');`

### Filtering

You can provide a `filter` function as part of the options object when subscribing. The `filter` function is called with each new value that is published. If the function returns `true`, the value is passed to the subscriber function. If the function returns `false`, the value is not passed to the subscriber function.


    pubSub.get('user-age').subscribe(
      (data) => console.log('Received:', data),
      {
        filter: (data) => data.age < 30,
      }
    );
    
    pubSub.get('user-age').publish({ name: 'Alice', age: 25 }); // logs: Received: { name: 'Alice', age: 25 }
    pubSub.get('user-age').publish({ name: 'Bob', age: 35 }); // does not log anything 

### Pausing and Resuming Subscriptions

You can pause and resume subscriptions:

    const subscription = pubSub.get('channel1').subscribe((data) => console.log('Received:', data));
    
    // pause the subscription
    subscription.pause();
    
    // publish some data
    pubSub.get('channel1').publish('Hello, world!'); // nothing is logged
    
    // resume the subscription
    subscription.resume();
    
    // publish some more data
    pubSub.get('channel1').publish('Hello again, world!'); // logs: Received: Hello again, world! 

### Observable Config
When creating an instance of PubSubMFE, you can provide `replayPolicy` and `bufferSize` as part of the `ObservableConfig` parameter. This will affect the behavior of the DataObservables that the instance creates.

The `replayPolicy` determines how many of the most recent published values to keep and send to new subscribers. The `bufferSize` determines the size of the buffer that holds the published values.

Here is an example of how to set these options:

javascript

    const pubSub = new PubSubMFE({
      ObservableConfig: {
        replayPolicy: 'all', // 'all' or 'last'
        bufferSize: 100, // any positive integer
      }
    }); 

In the example above, the `replayPolicy` is set to `'all'`, which means that all published values are kept (up to the `bufferSize`). When a new subscriber subscribes, they will receive all of these values immediately.

The `bufferSize` is set to 100, which means that the buffer can hold up to 100 values. If more than 100 values are published, the oldest values will be discarded to make room for the new values.

Now, when you subscribe and publish data, the settings will be respected:

    // create a subscriber
    pubSub.get('channel1').subscribe((data) => console.log('Received:', data));
    
    // publish more than 100 values
    for (let i = 0; i < 200; i++) {
      pubSub.get('channel1').publish(i);
    }
    
    // create a new subscriber
    pubSub.get('channel1').subscribe((data) => console.log('Received by new subscriber:', data));
    
    // the new subscriber receives the 100 most recent values (100-199) 

To set the `replayPolicy` to `'last'`, change the `ObservableConfig` as follows:



    const pubSub = new PubSubMFE({
      ObservableConfig: {
        replayPolicy: 'last', // 'all' or 'last'
        bufferSize: 100, // any positive integer
      }
    });

Now, when a new subscriber subscribes, they will only receive the most recent value, even if more values have been published.

## Contributing

Contributions are welcome! Please submit a pull request or create an issue if you have any improvements or find any bugs.

## License

PubSubMFE is licensed under the BSD-3-Clause license. See the `LICENSE` file for more information.