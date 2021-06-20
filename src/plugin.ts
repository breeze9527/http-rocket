import Source from './source';
import { RocketError } from './errors';
import type {
  HTTPMethod,
  ResponseType,
  Response,
  BodyType
} from './adapter';

export interface RequestContext {
  body: BodyType;
  headers: Headers;
  id: string;
  method: HTTPMethod;
  params: Record<string, string | number>;
  query: URLSearchParams;
  responseType: ResponseType;
  source: Source;
  timeout: number;
}

export interface RespondContext<D> {
  error: RocketError | null;
  url: string;
  request: Readonly<RequestContext>;
  response: Response<D> | null;
}
export interface PluginsOption {
  /** plugins option */
  [pluginName: string]: any;
}
interface FetchCallback {
  (): void;
  (error: RocketError): void;
  (error: null, response: any): void;
}
export abstract class RocketPlugin<Option = any> {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  abstract preRequest?(
    context: Readonly<RequestContext>,
    option: Option
  ): void;
  abstract request?(
    context: RequestContext,
    option: Option
  ): void;
  abstract preFetch(
    context: Readonly<RequestContext>,
    option: Option
  ): void;
  abstract fetch?(
    context: Readonly<RequestContext>,
    option: Option,
    callback: FetchCallback
  ): (() => void | undefined);
  abstract postFetch?(
    context: RespondContext<any>,
    option: Option
  ): void;
  abstract respond?(
    context: RespondContext<any>,
    option: Option
  ): void;
  abstract postRespond?(
    context: RespondContext<any>,
    option: Option
  ): void;
}
