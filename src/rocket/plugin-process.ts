import type {
  Adapter,
  Response
} from '../adapter';
import {
  AbortError,
  RocketError
} from '../errors';
import type {
  Plugin,
  RequestContext,
  RespondContext
} from "../plugin";

export interface PluginItem<O = any> {
  plugin: Plugin<O>;
  option: O;
}

function freezeCopy<D extends Record<string, any>>(data: D): Readonly<D> {
  return Object.freeze({...data});
}

export function processPreRequest(context: RequestContext, plugins: PluginItem<any>[]) {
  const preRequestContex = freezeCopy(context);
  for (const { plugin, option } of plugins) {
    if (typeof plugin.preRequest === 'function') {
      plugin.preRequest(preRequestContex, option);
    }
  }
}

export function processRequest(context: RequestContext, plugins: PluginItem<any>[]) {
  const requestContext = {...context};
  for (const { plugin, option } of plugins) {
    if (typeof plugin.request === 'function') {
      plugin.request(requestContext, option);
    }
  }
  return requestContext;
}

export function processPreFetch(context: RequestContext, plugins: PluginItem<any>[]) {
  const preFetchContext = freezeCopy(context);
  for (const { plugin, option } of plugins) {
    if (typeof plugin.preFetch === 'function') {
      plugin.preFetch(preFetchContext, option);
    }
  }
}

export function processFetch<D>(
  context: RequestContext,
  plugins: PluginItem<any>[],
  adapter: Adapter,
  eventHandler: (eventName: string, event?: any) => void,
  cancelerRef: (canceler?: () => void) => void,
  respondCallback: (context: RespondContext<D>) => void
) {
  const fetchContext = freezeCopy(context);

  const url = fetchContext.source.toURL(
    fetchContext.params,
    fetchContext.query
  );
  const settleResponse = (error: RocketError | null, response?: Response<D> | null) => {
    cancelerRef(undefined);
    if (error) {
      respondCallback({
        error,
        url,
        request: fetchContext,
        response: null,
      });
    } else if (response !== undefined) {
      respondCallback({
        error: null,
        url,
        request: fetchContext,
        response,
      });
    }
  };

  const applyFetchHook = (index: number): void => {
    cancelerRef(undefined);
    if (index >= plugins.length) {
      const canceler = adapter(
        {
          body: fetchContext.body,
          headers: fetchContext.headers,
          method: fetchContext.method,
          responseType: fetchContext.responseType,
          timeout: fetchContext.timeout,
          url
        },
        {
          progress: eventHandler.bind(undefined, 'progress'),
          success: (res: Response<any>) => {
            settleResponse(null, res);
          },
          error: (err: RocketError) => {
            settleResponse(err);
          },
          uploadProgress: eventHandler.bind(undefined, 'uploadProgress'),
          uploadSuccesse: eventHandler.bind(undefined, 'uploadSuccesse')
        }
      );
      cancelerRef(canceler);
    } else {
      const { plugin, option } = plugins[index];
      if (typeof plugin.fetch === 'function') {
        new Promise<any>((resolve, reject) => {
          const defaultCanceller = () => {
            reject(new AbortError());
          };
          const canceler = plugin.fetch!(
            fetchContext,
            option,
            (error?: null | RocketError, response?: any) => {
              if (error === undefined) {
                resolve(undefined);
              } else if (error !== null) {
                reject(error);
              } else if (response !== undefined) {
                resolve(response);
              } else {
                reject(new Error('Illegal fetch callback parameter in plugin: ' + plugin.name));
              }
            }
          );
          cancelerRef(canceler ?? defaultCanceller);
        }).then(
          res => {
            if (res === undefined) {
              applyFetchHook(index + 1);
            } else {
              settleResponse(null, res);
            }
          },
          err => {
            cancelerRef(undefined);
            if (err instanceof RocketError) {
              settleResponse(err);
            } else {
              cancelerRef(undefined);
              throw err;
            }
          }
        );
      } else {
        return applyFetchHook(index + 1);
      }
    }
  }
  applyFetchHook(0);
}

export function processPostFetch<D>(context: RespondContext<D>, plugins: PluginItem<any>[]) {
  const postFetchContext = freezeCopy(context);
  for (const {plugin, option} of plugins) {
    if (typeof plugin.postFetch === 'function') {
      plugin.postFetch(postFetchContext, option);
    }
  }
}

export function processRespond<D>(context: RespondContext<D>, plugins: PluginItem<any>[]) {
  const respondContext = {...context};
  for (const {plugin, option} of plugins) {
    if (typeof plugin.respond === 'function') {
      plugin.respond(respondContext, option);
    }
  }
  return respondContext;
}

export function processPostRespond<D>(context: RespondContext<D>, plugins: PluginItem<any>[]) {
  const postRespondContext = freezeCopy(context);
  for (const {plugin, option} of plugins) {
    if (typeof plugin.postRespond === 'function') {
      plugin.postRespond(postRespondContext, option);
    }
  }
}

