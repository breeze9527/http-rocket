import {
  mergeHeaders,
  normalizeHeadersLiteral,
  normalizeQueryLiteral
} from './util';

export type {
  AdapterCallbacks,
  Adapter,
  HTTPMethod,
  ResponseType,
  Response
} from './adapter';
export { default as xhrAdapter } from './adapter/xhr';
export {
  AbortError,
  NetworkError,
  ParseError,
  RocketError as Error,
  TimeoutError
} from './errors';
export {
  PluginsOption,
  Plugin,
  RequestContext,
  RespondContext,
  RocketContext
} from './plugin';
export {
  default as Rocket,
  default,
  Payload
} from './rocket';
export { default as Source } from './source';
export type {
  HeadersLiteral,
  QueryLiteral
} from './util';
export const util = {
  mergeHeaders,
  normalizeHeadersLiteral,
  normalizeQueryLiteral
};
export const version = process.env.npm_package_version as string;
