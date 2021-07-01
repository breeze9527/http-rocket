import { EventEmitter } from 'events';
import type {
  EditableRocketContext,
  RequestContext
} from "../plugin";
import type {
  Adapter,
  Response
} from '../adapter';
import {
  processAsyncHook,
  processSyncHook,
  PluginItem
} from './plugin-process';
import type { RocketError } from '../errors';
import Source from '../source';

function freezeCopy<D extends Record<string, any>>(
  context: D
): Readonly<D> {
  return Object.freeze(Object.assign({}, context));
}

class Mission<R, P extends string = string> extends EventEmitter {
  #canceller?: () => void;
  readonly promise: Promise<Response<R>>;
  readonly id: string;
  readonly source: Source<P>;
  constructor(
    plugins: PluginItem<any>[],
    context: EditableRocketContext<R, P>,
    adapter: Adapter
  ) {
    super();
    this.id = context.id;
    this.promise = new Promise<Response<R>>((resolve, reject) => {
      // binding events
      this.on('error', reject);
      this.on('success', resolve);
    });
    this.source = context.source;

    const cancellerRef = (canceller?: () => void) => {
      this.#canceller = canceller;
    }
    const updateRespondContext = function(error: RocketError | null, data?: Response<R> | null) {
      if (error) {
        context.respond = freezeCopy({
          error,
          response: null
        });
      } else if (data !== undefined) {
        context.respond = freezeCopy({
          error: null,
          response: data
        });
      }
    }

    const processRespondStage = () => {
      const processPostRespond = () => {
        // post-respond
        processSyncHook(
          plugins,
          freezeCopy(context),
          plugin => plugin.postRespond
        );

        // In the end, emit event to settle the promise base on respond context
        const respond = context.respond;
        if (respond.error !== null) {
          this.emit('error', respond.error);
        } else {
          this.emit('success', respond.response);
        }
      }

      // respond
      processAsyncHook<Response<R> | null>(
        plugins,
        () => freezeCopy(context),
        plugin => plugin.fetch,
        cancellerRef,
        (error, data) => {
          updateRespondContext(error, data);
          return true;
        },
        processPostRespond
      )
    }
    
    const processFetchStage = () => {
      // pre-fetch
      processSyncHook(
        plugins,
        freezeCopy(context),
        plugin => plugin.preFetch
      );

      // fetch
      processAsyncHook<Response<R> | null>(
        plugins,
        () => freezeCopy(context),
        plugin => plugin.fetch,
        cancellerRef,
        (error, data) => {
          updateRespondContext(error, data);
          return false;
        },
        () => {
          const processPostFetch = () => {
            // post-fetch
            processSyncHook(
              plugins,
              freezeCopy(context),
              plugin => plugin.postFetch
            );
            processRespondStage();
          };
          // If no plugin response, invoke adapter. 
          if (
            context.respond.error === null &&
            context.respond.response === null
          ) {
            const request = context.request;
            const adapterCanceller = adapter(
              {
                body: request.body,
                headers: request.headers,
                method: request.method,
                responseType: request.responseType,
                timeout: request.timeout,
                url: request.url
              },
              {
                error: (error: RocketError) => {
                  updateRespondContext(error);
                  processPostFetch();
                },
                progress: this.emit.bind(this, 'progress'),
                success: (response: Response<R>) => {
                  updateRespondContext(null, response);
                  processPostFetch();
                },
                uploadProgress: this.emit.bind(this, 'uploadProgress'),
                uploadSuccesse: this.emit.bind(this, 'uploadSuccesse')
              }
            );
            cancellerRef(adapterCanceller)
          } else {
            processPostFetch();
          }
        }
      )
    }

    // pre-request
    processSyncHook(
      plugins,
      freezeCopy(context),
      plugin => plugin.preRequest
    );
  
    // request
    processAsyncHook<RequestContext>(
      plugins,
      () => freezeCopy(context),
      plugin => plugin.request,
      cancellerRef,
      (error, data) => {
        if (error) {
          context.respond = freezeCopy({
            error,
            response: null
          });
          return false;
        }
        if (data) {
          context.request = freezeCopy(data);
        }
        return true;
      },
      () => {
        if (context.respond.error) {
          // skip preFetch, fetch, postFetch
          processRespondStage();
        } else {
          this.emit('request', context.request);
          processFetchStage();
        }
      }
    );
  }

  abort() {
    if (this.#canceller) {
      this.#canceller();
    }
  }
}

export default Mission;
