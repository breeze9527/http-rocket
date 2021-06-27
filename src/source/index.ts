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
interface SourceOption<P extends string> {
  hostName: string;
  port?: number;
  path?: string | Path<P>;
  protocol: Protocol;
  userName?: string;
  password?: string;
}
class Source<P extends string = string> {
  #path: Path<P>;
  #protocol: Protocol;
  #hostName: string;
  #userName: string;
  #port?: number;
  #password: string;
  static from<P extends string = string>(sourceLiteral: string) {
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
      return new Source<P>({
        hostName,
        port: port === '' ? undefined : parseInt(port, 10),
        path,
        protocol: protocol as Protocol,
        userName,
        password
      });
    }
  }
  constructor(options: SourceOption<P>) {
    this.#protocol = options.protocol
    this.#userName = options.userName ?? '';
    this.#password = options.password ?? '';
    this.#hostName = options.hostName;
    this.#port = options.port;
    const path = options.path ?? '';
    if (typeof path === 'string') {
      this.#path = Path.from<P>(path);
    } else {
      this.#path = path;
    }
  }
  private extend<NP extends string = P>(option: Partial<SourceOption<NP>>) {
    return new Source<NP>({
      hostName: this.#hostName,
      password: this.#password,
      port: this.#port,
      protocol: this.#protocol,
      userName: this.#userName,
      path: this.#path.clone() as Path<NP> | undefined,
      ...option,
    });
  }

  get protocol() {
    return this.#protocol;
  }
  setProtocol(protocol: Protocol) {
    return this.extend<P>({ protocol });
  }
  get path() {
    return this.#path;
  }
  setPath<NP extends string = string>(path: Path<NP> | string) {
    return this.extend<NP>({ path });
  }
  get userName() {
    return this.#userName ?? '';
  }
  setUserName(userName: string = '') {
    return this.extend<P>({ userName });
  }
  get password() {
    return this.#password ?? '';
  }
  setPassword(password: string = '') {
    return this.extend<P>({ password });
  }
  get port() {
    return this.#port;
  }
  setPort(port?: number) {
    return this.extend<P>({ port });
  }
  get hostName() {
    return this.#hostName;
  }
  setHostName(hostName: string) {
    return this.extend<P>({ hostName });
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
      result += ':' + port;
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
      const options: Partial<SourceOption<P>> = {
        protocol: protocol as Protocol,
        userName: userName,
        password: password,
        hostName: hostname
      };
      if (port) {
        options.port = parseInt(port, 10);
      }
      return this.extend<P>(options);
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

  toURL(param?: Record<P, string | number>, query: URLSearchParams | QueryLiteral = {}) {
    let result = this.origin;
    const resultPath = this.#path.normalize(param);
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

  clone() {
    return this.extend<P>({});
  }
}

export default Source;
