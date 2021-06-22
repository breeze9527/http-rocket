import type { Adapter } from './index';
import {
  AbortError,
  NetworkError,
  ParseError,
  TimeoutError
} from '../errors';
import { parseResponseHeaders } from '../util';

export const xhrAdapter: Adapter = function xhrAdapter(options, callbacks) {
  const xhr = new XMLHttpRequest();
  const {
    body = null,
    timeout,
    headers,
    url,
    method,
    responseType = 'text'
  } = options;
  const {
    error: errorCallabck,
    progress: progressCallback,
    success: successCallback,
    uploadProgress: uploadProgressCallback,
    uploadSuccesse: uploadSuccessCallback
  } = callbacks;
  xhr.responseType = responseType === 'json' ? 'text' : responseType;
  // set timeout 
  if (timeout !== undefined) {
    xhr.timeout = timeout;
  }

  // open xhr
  xhr.open(method, url);

  // headers
  for (const [key, value] of headers) {
    xhr.setRequestHeader(key, value);
  }

  // handle response success
  xhr.onload = function handleXhrLoad() {
    const responseHeader = parseResponseHeaders(xhr.getAllResponseHeaders());
    const responseStatus = xhr.status;
    if (responseType === 'json') {
      const text = xhr.responseText.trim();
      let result = null;
      if (text !== '') {
        try {
          result = JSON.parse(xhr.responseText) as Record<string, any>;
        } catch (e) {
          errorCallabck(new ParseError(e));
        }
      }
      successCallback({
        body: result,
        headers: responseHeader,
        status: responseStatus
      });
    } else {
      successCallback({
        body: xhr.response,
        headers: responseHeader,
        status: responseStatus
      });
    }
  }

  // timeout error
  xhr.ontimeout = function timeoutHandler() {
    errorCallabck(new TimeoutError());
  }
  // abort
  xhr.onabort = function() {
    errorCallabck(new AbortError());
  }
  // network error
  xhr.onerror = function errorHandler() {
    errorCallabck(new NetworkError());
  }
  xhr.onprogress = function progressHandler(e) {
    progressCallback(e);
  }

  // upload
  const upload = xhr.upload;
  if (upload) {
    // upload progress
    upload.onprogress = function uploadProgressHandler(e) {
      return uploadProgressCallback(e);
    }
    // upload success
    upload.onload = function uploadSuccessHandle() {
      return uploadSuccessCallback();
    }
  }

  // send it
  xhr.send(body);

  return function abort() {
    if (xhr.readyState !== XMLHttpRequest.DONE) {
      xhr.abort();
    }
  }
}
