/**
 * https://user:password@host.domain:port/path/to/source?query=value
 */

import Path from './path';
import {
  QueryLiteral,
  normalizeQueryLiteral
} from '../util';

const REG_MATCH_HREF = /^(https?):\/\/(?:([^:@\/]+)(?::([^:@\/]+))?@)?([^\/:]+)(?::(\d+))?(?:\/([^?]+)*)?$/;
//                         protocol     username     password           host     port
type Protocol = 'http' | 'https';
interface SourceOption {
  hostName: string;
  port?: number;
  path?: string | Path;
  protocol: Protocol;
  userName?: string;
  password?: string;
}
class Source {
  #path: Path;
  #protocol: Protocol;
  #hostName: string;
  #userName: string;
  #port?: number;
  #password: string;
  static from(sourceLiteral: string) {
    const regMatchResult = REG_MATCH_HREF.exec(sourceLiteral);
    if (regMatchResult === null) {
      throw new Error(`Illegal source format: ${sourceLiteral}`);
    } else {
      const [
        _match,
        protocol,
        userName,
        password,
        hostName,
        port,
        path
      ] = regMatchResult;
      return new Source({
        hostName,
        port: port === '' ? undefined : parseInt(port, 10),
        path,
        protocol: protocol as Protocol,
        userName,
        password
      });
    }
  }
  constructor(options: SourceOption) {
    this.#protocol = options.protocol
    this.#userName = options.userName ?? '';
    this.#password = options.password ?? '';
    this.#hostName = options.hostName;
    this.#port = options.port;
    const path = options.path ?? '';
    if (typeof path === 'string') {
      this.#path = Path.from(path);
    } else {
      this.#path = path;
    }
  }

  get protocol() {
    return this.#protocol;
  }
  setProtocol(protocol: Protocol) {
    this.#protocol = protocol;
  }
  get path() {
    return this.#path;
  }
  setPath(path: Path | string) {
    this.#path = typeof path === 'string'
      ? Path.from(path)
      : path;
  }
  get userName() {
    return this.#userName ?? '';
  }
  setUserName(username: string = '') {
    this.#userName = username;
  }
  get password() {
    return this.#password ?? '';
  }
  setPassword(password: string = '') {
    this.#password = password;
  }
  get port() {
    return this.#port;
  }
  setPort(port?: number) {
    return this.#port = port;
  }
  get hostName() {
    return this.#hostName;
  }
  setHostName() {
    return this.#hostName;
  }

  // computed accessors
  get origin() {
    const {
      hostName,
      userName,
      password,
      protocol,
      port
    } = this;
    let result = protocol + '://';
    if (userName) {
      let auth = userName;
      if (password) {
        auth += ':' + password;
      }
      result += auth;
    }
    result += hostName;
    if (port !== undefined) {
      result+= ':' + port;
    }
    return result;
  }
  setOrigin(origin: string) {
    const regMatchResult = REG_MATCH_HREF.exec(origin);
    if (regMatchResult === null) {
      throw new Error(`Illegal origin: ${origin}`);
    } else {
      const [
        _matched,
        protocol,
        userName = '',
        password = '',
        hostname,
        port
      ] = regMatchResult;
      this.#protocol = protocol as Protocol;
      this.#userName = userName;
      this.#password = password;
      this.#hostName = hostname;
      if (port) {
        this.#port = parseInt(port, 10);
      }
    }
  }

  toString() {
    const {
      origin,
      path
    } = this;
    const pathStr = path.toString();
    let result = origin;
    if (pathStr) {
      result += '/' + pathStr;
    }
    return result;
  }

  build(param: Record<string, string | number> = {}, query: URLSearchParams | QueryLiteral = {}) {
    let result = this.origin;
    const resultPath =  this.#path.normalize(param);
    if (resultPath !== '') {
      result += '/' + resultPath;
    }
    const queryString = query instanceof URLSearchParams
      ? query.toString()
      : normalizeQueryLiteral(query).toString()
    if (queryString !== '') {
      result += '?' + queryString;
    }
    return result;
  }
}

export default Source;
