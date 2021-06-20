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
import RocketMission from './mission';
import {
  RocketPlugin,
  PluginsOption,
  RequestContext 
} from '../plugin';

export interface Payload {
  params?: Record<string, string | number>;
  query?: URLSearchParams | QueryLiteral;
  body?: BodyType;
  headers?: Headers | HeadersLiteral | ((header: Headers) => Headers);
  pluginOptions?: PluginsOption;
}
interface RocketOption<D> {
  adapter?: Adapter; // XHR, JSONP, http-client(node.js)
  headers?: Headers | HeadersLiteral;
  method: HTTPMethod;
  payload?(data: D): Payload;
  plugins?: RocketPlugin<any>[];
  responseType?: ResponseType;
  timeout?: number;
  source: string | Source;
}

let nextId = 0;
class Rocket<D, R> {
  readonly source: Source;
  readonly method: HTTPMethod;
  readonly timeout: number;
  readonly responseType: ResponseType;
  #adapter: Adapter;
  #headers: Headers;
  #normalizePayload?: (data: D) => Payload;
  #plugins: RocketPlugin<any>[];
  constructor(options: RocketOption<D>);
  constructor(method: HTTPMethod, source: string | Source);
  constructor(_optionsOrMethod: RocketOption<D> | HTTPMethod, _src?: string | Source) {
    const options: RocketOption<D> = typeof _optionsOrMethod === 'string'
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
      this.method = options.method;
    }
    this.responseType = options.responseType ?? 'text';
    this.timeout = options.timeout ?? 0;
    if (source === undefined) {
      throw new Error('Missing required option: source');
    } else {
      this.source = typeof source === 'string' ? Source.from(source) : source;
    }
  }
  private normalizePayload(data: D): Payload {
    const source = this.source;
    const normalizer = this.#normalizePayload;
    if (data !== undefined && normalizer === undefined) {
      throw new Error(`Payload normalizer not found: ${source}`);
    }
    return normalizer?.(data) ?? {}
  }
  private createRequestContext(payload: Payload): RequestContext {
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
      method: this.method,
      params,
      query,
      responseType: this.responseType,
      timeout: this.timeout,
      source: this.source
    };
  }

  send(data: D) {
    const payload = this.normalizePayload(data);
    const requestContext = this.createRequestContext(payload);
    const plugins = this.#plugins.slice();
    plugins.reverse();
    return new RocketMission<R>(
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
