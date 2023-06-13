/*
 * Copyright (c) 2023, Nicholas Sterling
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * 3. Neither Nicholas Sterling nor the names of its contributors may 
 *    be used to endorse or promote products derived from this software 
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * This DataObservable class is highly inspired by Rxjs's implementation of a ReplaySubject. 
 * 
 * This class combines many of the same principles of a replay subject but changes the names of 
 *   some of the functions to improve the developer experience. For example, in Rxjs would use 
 *   the ``next`` function to publish new data but we call it ``setState``.
 * 
 * A major reason for the existence of the DataObservable is to prevent the requirement of  
 *   third party dependencies. 
 */
class DataObservable {
  /**
   * Creates a new DataObservable.
   * @param {Object} config - Configuration options for the DataObservable.
   * @param {number} config.bufferSize - The maximum size of the buffer. Default is 1.
   * @param {string} config.replayPolicy - The replay policy for new subscribers. Possible values are 'last' (only the most recent value is replayed) or 'all' (all values in the buffer are replayed). Default is 'last'.
   */
  constructor(config = {}) {
    const { bufferSize = 1, replayPolicy = 'last' } = config;
    this.bufferSize = bufferSize;
    this.buffer = [];
    this.observers = [];
    this.observerState = {};
    this.replayPolicy = replayPolicy;
  }

  /**
   * Publishes a new value to the DataObservable.
   * @param {*} value - The value to publish.
   */
  setState(value) {
    this.buffer.push(value);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
    this.observers.forEach(observer => {
      this.observerState[observer] = value;
      observer(value);
    });
  }

  /**
   * Subscribes a function to the DataObservable.
   * @param {function} callback - The function to subscribe.
   * @param {Object} [options] - Options for the subscription.
   * @param {function} [options.filter] - A function to filter the values that the callback receives.
   * @returns {Object} An object with methods for unsubscribing, pausing and resuming the subscription.
   */
  subscribe(callback, { filter, replayPolicy } = {}) {
    let paused = false;
    const filteredObserver = value => {
      if (!paused && (!filter || filter(value))) {
        this.observerState[callback] = value;
        callback(value);
      }
    };
    this.observers.push(filteredObserver);

    /**
     * Replays the values in the buffer to the observer.
     */
    const replay = () => {
      if (replayPolicy === 'last' || (replayPolicy === undefined && this.replayPolicy === 'last')) {
        // Replay the most recent value
        this.buffer.slice(-1).forEach(value => {
          this.observerState[callback] = value;
          filteredObserver(value);
        });
      } else if (replayPolicy === 'all' || (replayPolicy === undefined && this.replayPolicy === 'all')) {
        // Replay all values in the buffer
        this.buffer.forEach(value => {
          this.observerState[callback] = value;
          filteredObserver(value);
        });
      }
    };
    replay();

    return {
      /**
       * Unsubscribes the function from the DataObservable.
       */
      unsubscribe: () => {
        this.observers = this.observers.filter(o => o !== filteredObserver);
        delete this.observerState[callback];
      },
      /**
       * Pauses the subscription. The callback will not receive any more values until the subscription is resumed.
       */
      pause: () => {
        paused = true;
      },
      /**
       * Resumes the subscription. The callback will start receiving values again.
       */
      resume: () => {
        paused = false;
        replay();
      },
    };
  }

  /**
   * Returns the current values in the buffer.
   * @returns {Array} The values in the buffer.
   */
  getBuffer() {
    return this.buffer;
  }

  /**
   * Clears the buffer.
   */
  clearBuffer() {
    this.buffer = [];
  }

  /**
   * Returns the number of subscribers.
   * @returns {number} The number of subscribers.
   */
  getObserverCount() {
    return this.observers.length;
  }

  /**
   * Removes all subscribers.
   */
  unsubscribeAll() {
    this.observers = [];
  }

  /**
   * Returns the current replay policy.
   * @returns {string} The replay policy.
   */
  getReplayPolicy() {
    return this.replayPolicy;
  }

}

/**
 * PubSubMFE is a library that allows for decoupled data communication between separate UI elements. 
 *   These elements could be component based or even segmented by micro-frontend. PubSubMFE allows a 
 *   consumer to subscribe to a shared observable "channel" and a publisher to push data to that channel.
 *   Data that's published to this channel can be literally anything that JavaScript supports. By 
 *   default it allows for a single item to be published but you can alos add a 'bufferSize' and a 
 *   'replayPolicy' to customize how much information a specific channel can support and how it's replayed 
 *   back to the consumer. Please refer to the examples for more information.
 */
class PubSubMFE {
  static store = new Map();
  static firstInstanceParams = {};

/**
 * Creates a new PubSubMFE instance.
 * @param {Object} params - Configuration options for the instance.
 * @param {Map} params.storeMap - A Map object to use as the store. If this is provided, the 'store' parameter is ignored.
 * @param {Object} params.ObservableConfig - Configuration options for the DataObservables created by the instance.
 * @throws {Error} If the 'default' channel already exists and an ObservableConfig is passed that is different from the first instance's.
 */
constructor(params = {}) {
  const { storeMap, ObservableConfig = {} } = params;

  // Save the first instance params for future reference
  if (!PubSubMFE.firstInstanceParams['default']) {
    PubSubMFE.firstInstanceParams['default'] = params;
  }

  // Determine which store to use
  let storeToUse = storeMap instanceof Map ? storeMap : storeMap?.['default'];
  if (!storeToUse) {
    if (!PubSubMFE.store['default']) {
      PubSubMFE.store['default'] = new Map();
    }
    storeToUse = PubSubMFE.store['default'];
  }

  // If the 'default' channel already exists, check if the ObservableConfig is the same as the first instance's
  if (storeToUse.has('default')) {
    if (Object.keys(ObservableConfig).length) {
      if(!this._isEqual(PubSubMFE.firstInstanceParams['default'].ObservableConfig, ObservableConfig)){
        throw new Error(`channel default already exists, cannot pass ObservableConfig`);
      }
    }
  } else {
    // Create a new DataObservable with the provided ObservableConfig and add it to the store
    storeToUse.set('default', new DataObservable(ObservableConfig));
  }

  this.store = storeToUse;
  this.config = ObservableConfig;
}
_isEqual(val1, val2) {
  if (val1 === val2) return true;
  if (val1 instanceof Date && val2 instanceof Date) return val1.getTime() === val2.getTime();
  if (!val1 || !val2 || (typeof val1 !== 'object' && typeof val2 !== 'object')) return val1 === val2;
  if (val1.prototype !== val2.prototype) return false;
  let keys1 = Object.keys(val1);
  let keys2 = Object.keys(val2);
  if (keys1.length !== keys2.length) return false;
  for (let key of keys1) {
      if (!keys2.includes(key) || !this._isEqual(val1[key], val2[key])) return false;
  }
  return true;
}


  /**
   * Creates a new DataObservable for the given channel if one does not already exist.
   * @param {string} channel - The channel to create a DataObservable for.
   */
  _generateObservable(channel) {
    if (!this.store.has(channel)) {
      this.store.set(channel, new DataObservable(this.config));
    }
  }

  /**
   * Returns the raw DataObservable for the given channel.
   * @param {string} channel - The channel to get the DataObservable for.
   * @throws {Error} If the channel is not provided.
   * @returns {DataObservable} The DataObservable for the channel.
   */
  get(channel) {
    if (!channel) {
      throw new Error("Channel is required");
    }
    this._generateObservable(channel);
    return this.store.get(channel);
  }

  /**
   * Sets the state of the DataObservable for the given channel.
   * @param {string} channel - The channel to update the state for.
   * @param {*} newState - The new state for the DataObservable.
   * @throws {Error} If the channel or new state is not provided.
   */
  setState(channel, newState) {
    if (!channel) {
      throw new Error("Channel is required");
    }
    if (newState === undefined) {
      throw new Error("New state is required");
    }
    this._generateObservable(channel);
    this.store.get(channel).setState(newState);
  }

  /**
   * Subscribes a function to the DataObservable for the given channel.
   * @param {string} channel - The channel to subscribe to.
   * @param {function} callback - The function to subscribe.
   * @param {Object} [options] - Options for the subscription.
   * @param {function} [options.filter] - A function to filter the values that the callback receives.
   * @throws {Error} If the channel or callback is not provided.
   * @returns {Object} An object with methods for unsubscribing, pausing and resuming the subscription.
   */
  subscribe(channel, callback, options) {
    if (!channel) {
      throw new Error("Channel is required");
    }
    if (!callback) {
      throw new Error("Callback is required");
    }
    this._generateObservable(channel);
    return this.store.get(channel).subscribe(callback, options);
  }

  /**
   * Unsubscribes all functions from the DataObservable for the given channel.
   * @param {string} channel - The channel to unsubscribe from.
   * @throws {Error} If the channel is not provided.
   */
  unsubscribeAll(channel) {
    if (!channel) {
      throw new Error("Channel is required");
    }
    this._generateObservable(channel);
    this.store.get(channel).unsubscribeAll();
  }

  /**
   * Clears the buffer for the DataObservable for the given channel.
   * @param {string} channel - The channel to clear the buffer for.
   * @throws {Error} If the channel is not provided.
   */
  clearBuffer(channel) {
    if (!channel) {
      throw new Error("Channel is required");
    }
    this._generateObservable(channel);
    this.store.get(channel).clearBuffer();
  }

  /**
   * Returns the current replay policy for the DataObservable for the given channel.
   * @param {string} channel - The channel to get the replay policy for.
   * @throws {Error} If the channel is not provided.
   * @returns {string} The replay policy.
   */
  getReplayPolicy(channel) {
    if (!channel) {
      throw new Error("Channel is required");
    }
    this._generateObservable(channel);
    return this.store.get(channel).getReplayPolicy();
  }

}

export { PubSubMFE }

