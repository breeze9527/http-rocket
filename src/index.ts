export type {
  HTTPMethod,
  ResponseType,
  Response,
  AdapterCallbacks,
  Adapter
} from './adapter';
export { xhrAdapter } from './adapter/xhr';
export {
  RocketError as Error,
  NetworkError,
  TimeoutError,
  AbortError,
  ParseError
} from './errors';
export {
  PluginsOption,
  Plugin,
  RequestContext,
  RespondContext
} from './plugin';
export {
  default as Rocket,
  default as default,
  Payload
} from './rocket';
export { default as Source } from './source';
export { default as Path } from './source/path';
export type {
  HeadersLiteral,
  QueryLiteral
} from './util';
import {
  mergeHeaders,
  normalizeHeadersLiteral,
  normalizeQueryLiteral
} from './util';
export const util = {
  mergeHeaders,
  normalizeHeadersLiteral,
  normalizeQueryLiteral
};
export const version = process.env.npm_package_version!;
