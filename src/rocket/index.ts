import Source from '../source';
import {
  Adapter,
  ResponseType,
  HTTPMethod,
  BodyType,
  xhrAdapter
} from '../adapter';
import {
  HeadersLiteral,
  QueryLiteral,
  normalizeHeadersLiteral,
  normalizeQueryLiteral,
  mergeHeaders
} from '../util';
import Mission from './mission';
import {
  Plugin,
  PluginsOption,
  RequestContext 
} from '../plugin';

export interface Payload<P extends string> {
  params?: Record<P, string | number>;
  query?: URLSearchParams | QueryLiteral;
  body?: BodyType;
  headers?: Headers | HeadersLiteral | ((header: Headers) => Headers);
  pluginOptions?: PluginsOption;
}
interface RocketOption<D, P extends string> {
  adapter?: Adapter; // XHR, JSONP, http-client(node.js)
  headers?: Headers | HeadersLiteral;
  method: HTTPMethod;
  payload?(data: D): Payload<P>;
  plugins?: Plugin<any>[];
  responseType?: ResponseType;
  timeout?: number;
  source: string | Source<P>;
}

let nextId = 0;
class Rocket<D = any, R = any, P extends string = string> {
  #method: HTTPMethod;
  #responseType: ResponseType;
  #timeout: number;
  #adapter: Adapter;
  #headers: Headers;
  #normalizePayload?: (data: D) => Payload<P>;
  #plugins: Plugin<any>[];
  #source: Source<P>;
  constructor(options: RocketOption<D, P>);
  constructor(method: HTTPMethod, source: string | Source<P>);
  constructor(_optionsOrMethod: RocketOption<D, P> | HTTPMethod, _src?: string | Source<P>) {
    const options: RocketOption<D, P> = typeof _optionsOrMethod === 'string'
      ? {
        method: _optionsOrMethod,
        source: _src!
      }
      : _optionsOrMethod;
    const {
      headers = new Headers(),
      method,
      plugins = [],
      source
    } = options;
    this.#adapter = options.adapter ?? xhrAdapter;
    this.#headers = headers instanceof Headers
      ? headers
      : normalizeHeadersLiteral(headers);
    this.#normalizePayload = options.payload;
    this.#plugins = plugins.slice();
    if (method === undefined) {
      throw new Error('Missing required option: method');
    } else {
      this.#method = options.method;
    }
    this.#responseType = options.responseType ?? 'text';
    this.#timeout = options.timeout ?? 0;
    if (source === undefined) {
      throw new Error('Missing required option: source');
    } else {
      this.#source = typeof source === 'string' ? Source.from<P>(source) : source;
    }
  }
  private normalizePayload(data: D): Payload<P> {
    const source = this.#source;
    const normalizer = this.#normalizePayload;
    if (data !== undefined && normalizer === undefined) {
      throw new Error(`Payload normalizer not found: ${source}`);
    }
    return normalizer?.(data) ?? {}
  }
  private createRequestContext(payload: Payload<P>): RequestContext {
    const id = nextId ++;
    const {
      body = null,
      headers: payloadHeaders = {},
      params = {},
      query: payloadQuery = {}
    } = payload;
    const headers = typeof payloadHeaders === 'function'
      ? payloadHeaders(this.#headers)
      : mergeHeaders(this.#headers, payloadHeaders);
    const query = payloadQuery instanceof URLSearchParams
      ? payloadQuery
      : normalizeQueryLiteral(payloadQuery);
    return {
      body,
      headers,
      id: id.toString(),
      method: this.#method,
      params,
      query,
      responseType: this.#responseType,
      timeout: this.#timeout,
      source: this.#source.clone()
    };
  }

  send(data: D) {
    const payload = this.normalizePayload(data);
    const requestContext = this.createRequestContext(payload);
    const plugins = this.#plugins.slice();
    plugins.reverse();
    return new Mission<R>(
      plugins.map(plugin => ({
        plugin,
        option: payload.pluginOptions?.[plugin.name]
      })),
      requestContext,
      this.#adapter
    );
  }
}

export default Rocket;
