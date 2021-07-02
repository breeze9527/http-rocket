import Source from '../source';
import {
  Adapter,
  BodyType,
  HTTPMethod,
  ResponseType
} from '../adapter';
import xhrAdapter from '../adapter/xhr';
import {
  HeadersLiteral,
  QueryLiteral,
  mergeHeaders,
  normalizeHeadersLiteral
} from '../util';
import Mission from './mission';
import {
  EditableRocketContext,
  Plugin,
  PluginsOption
} from '../plugin';

export interface Payload<P extends string> {
  body?: BodyType;
  headers?: Headers | HeadersLiteral | ((header: Headers) => Headers);
  param?: Record<P, string | number>;
  pluginOption?: PluginsOption;
  query?: URLSearchParams | QueryLiteral;
}

interface RocketOption<D, P extends string> {
  adapter?: Adapter; // XHR, JSONP, http-client(node.js)
  headers?: Headers | HeadersLiteral;
  method: HTTPMethod;
  payload?(data: D): Payload<P>;
  plugins?: Plugin<any>[];
  responseType?: ResponseType;
  source: string | Source<P>;
  timeout?: number;
}

let nextId = 0;

class Rocket<D = any, R = any, P extends string = string> {
  #adapter: Adapter;
  #headers: Headers;
  #method: HTTPMethod;
  #normalizePayload?: (data: D) => Payload<P>;
  #plugins: Plugin<any>[];
  #responseType: ResponseType;
  #source: Source<P>;
  #timeout: number;

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
      this.#source = typeof source === 'string' ? new Source<P>(source) : source;
    }
  }

  private createContext(payload: Payload<P>): EditableRocketContext<R, P> {
    nextId += 1;
    const id = nextId;
    const {
      body = null,
      headers: payloadHeaders = {}
    } = payload;
    const headers = typeof payloadHeaders === 'function'
      ? payloadHeaders(this.#headers)
      : mergeHeaders(this.#headers, payloadHeaders);
    const source = this.#source;
    return {
      id: id.toString(),
      request: Object.freeze({
        body,
        headers,
        method: this.#method,
        responseType: this.#responseType,
        timeout: this.#timeout,
        url: source.toURL(payload.param, payload.query)
      }),
      respond: Object.freeze({
        error: null,
        response: null
      }),
      source
    };
  }

  private normalizePayload(data: D): Payload<P> {
    const source = this.#source;
    const normalizer = this.#normalizePayload;
    if (data !== undefined && normalizer === undefined) {
      throw new Error(`Payload normalizer not found: ${source}`);
    }
    return normalizer ? normalizer(data) : {};
  }

  send(data: D) {
    const payload = this.normalizePayload(data);
    const requestContext = this.createContext(payload);
    const plugins = this.#plugins.slice();
    plugins.reverse();
    return new Mission<R, P>(
      plugins.map(plugin => ({
        option: payload.pluginOption?.[plugin.name],
        plugin
      })),
      requestContext,
      this.#adapter
    );
  }
}

export default Rocket;
