import type {
  BodyType,
  HTTPMethod,
  Response,
  ResponseType
} from './adapter';
import { RocketError } from './errors';
import type Source from './source';

export interface RequestContext {
  body: BodyType;
  headers: Headers;
  method: HTTPMethod;
  responseType: ResponseType;
  timeout: number;
  url: URL;
}

export interface RespondContext<R = any> {
  error: RocketError | null;
  response: Response<R> | null;
}

export interface RocketContext<R = any, P extends string = string> {
  readonly id: string;
  readonly source: Source<P>;
  readonly request: Readonly<RequestContext>;
  readonly respond: Readonly<RespondContext<R>>;
}
export type EditableRocketContext<D = any, P extends string = string> = {
  -readonly [K in keyof RocketContext<D, P>]: RocketContext<D, P>[K];
}

export interface PluginsOption {
  /** plugins option */
  [pluginName: string]: any;
}
export interface AsyncHookCallback<D> {
  (): void;
  (error: RocketError): void;
  (error: null, data: D): void;
}
export type AsyncHook<O, D> = (
  context: RocketContext<any, string>,
  option: O,
  callback: AsyncHookCallback<D>
) => (() => void) | undefined
export type SyncHook<O> = (context: RocketContext<any, string>, option: O) => void;

export abstract class Plugin<O = any> {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  abstract preRequest?: SyncHook<O>;
  abstract request?: AsyncHook<O, RequestContext>;
  abstract preFetch?: SyncHook<O>;
  abstract fetch?: AsyncHook<O, Response<any>>;
  abstract postFetch?: SyncHook<O>;
  abstract respond?: AsyncHook<O, Response<any>>;
  abstract postRespond?: SyncHook<O>;
}
