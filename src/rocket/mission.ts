import { EventEmitter } from 'events';
import type {
  RequestContext,
  RespondContext
} from "../plugin";
import type {
  Adapter,
  Response,
  HTTPMethod
} from '../adapter';
import type Source from '../source';
import {
  PluginItem,
  processRequest,
  processPreRequest,
  processFetch,
  processPreFetch,
  processPostFetch,
  processRespond,
  processPostRespond
} from './plugin-process';

class Mission<D> extends EventEmitter {
  #canceler?: () => void;
  readonly promise: Promise<Response<D>>;
  readonly method: HTTPMethod;
  readonly id: string;
  readonly url: string;
  readonly source: Source;
  constructor(
    plugins: PluginItem<any>[],
    requestContext: RequestContext,
    adapter: Adapter
  ) {
    super();
    // pre-request
    processPreRequest(requestContext, plugins);
    
    // request
    const fetchContext = processRequest(requestContext, plugins);
    this.method = fetchContext.method; 
    this.id = fetchContext.id;
    this.source = fetchContext.source;
    this.url = fetchContext.source.toURL(
      fetchContext.param,
      fetchContext.query
    );
    
    // pre-fetch
    processPreFetch(fetchContext, plugins);

    // fetch
    processFetch<D>(
      fetchContext,
      plugins,
      adapter,
      (eventName: string, event?: any) => {
        this.emit(eventName, event);
      },
      canceler => {
        this.#canceler = canceler;
      },
      respondContext => {
        // post-fetch hook
        processPostFetch(respondContext, plugins);

        // respond hook
        const postResponseContext = processRespond(respondContext, plugins);

        processPostRespond(postResponseContext, plugins);

        // emit events & resolve/reject promise
        if (postResponseContext.error !== null) {
          this.emit('error', postResponseContext.error);
        } else if (postResponseContext.response !== null) {
          this.emit('success', postResponseContext.response);
        } else {
          throw new Error('Unexpected response status');
        }
      }
    );
    
    this.promise = new Promise<Response<D>>((resolve, reject) => {
      // bindging events
      this.on('error', reject);
      this.on('success', resolve);
    });
  }

  abort() {
    this.#canceler?.();
  }
}

export default Mission;
