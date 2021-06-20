import { RocketError } from '../errors';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE';
export type ResponseType = 'text' | 'blob' | 'arraybuffer' | 'document' | 'json';
export type BodyType = Document | BodyInit | null;

export interface Response<T> {
  body: T;
  headers: Headers;
  status: number;
}
export interface AdapterCallbacks<T = unknown> {
  progress?(event: ProgressEvent): void;
  success?(data: Response<T | null>): void;
  error?(error: RocketError): void;
  uploadProgress?(event: ProgressEvent): void;
  uploadSuccesse?(): void;
}
export interface AdapterOptions {
  body?: Document | BodyInit | null;
  headers?: Headers;
  method: HTTPMethod;
  responseType?: ResponseType;
  timeout?: number;
  url: string;
}
export interface Adapter {
  (
    options: AdapterOptions,
    callbacks: AdapterCallbacks
  ): () => void;
}

export { xhrAdapter } from './xhr';
