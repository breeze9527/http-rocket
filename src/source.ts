import {
  QueryLiteral,
  normalizeQueryLiteral
} from './util';

type Protocol = 'http' | 'https';
type PahtNode<P extends string = string> = {
  name: P;
  type: 'param';
} | {
  name: string;
  type: 'static';
};
interface SourceOption<P extends string> {
  hostName: string;
  password?: string;
  path?: string | PahtNode<P>[];
  port?: number;
  protocol: Protocol;
  userName?: string;
}

const PATH_SEPARATOR = '/';
const PARAMETER_PREFIX = ':';
const REG_VALID_PARAM_NAME = /^[a-z]+$/i;
const REG_EMPTY = /^\s*$/;
const REG_MATCH_HREF = /^(https?):\/\/(?:([^:@\/]+)(?::([^:@\/]+))?@)?([^\/:]+)(?::(\d+))?(?:\/([^?]+)*)?$/;
//                       protocol     username     password           host     port       path

class Source<P extends string = string> {
  #component: {
    hostName: string;
    password: string;
    pathNodes: PahtNode<P>[];
    port: number | null;
    protocol: Protocol;
    userName: string;
  };

  static parsePath<P extends string = string>(path: string) {
    const nodes: PahtNode<P>[] = [];
    for (const str of path.split(PATH_SEPARATOR)) {
      if (REG_EMPTY.test(str)) {
        continue;
      }
      const node: PahtNode<P> = str[0] === PARAMETER_PREFIX
        ? {
          name: str.slice(1) as P,
          type: 'param'
        }
        : {
          name: str,
          type: 'static'
        }
      nodes.push(node);
    }
    return nodes;
  }

  constructor(option: SourceOption<P> | string) {
    if (typeof option === 'string') {
      const regMatchResult = REG_MATCH_HREF.exec(option);
      if (regMatchResult === null) {
        throw new Error(`Illegal source: ${option}`);
      } else {
        const [
          _match,
          protocol,
          userName = '',
          password = '',
          hostName,
          port,
          path
        ] = regMatchResult;
        this.#component = {
          hostName: hostName,
          password: password,
          pathNodes: path ? Source.parsePath<P>(path) : [],
          port: port ? parseInt(port, 10) : null,
          protocol: protocol as Protocol,
          userName
        };
      }
    } else {
      const pathOption = option.path;
      const pathNodes = typeof pathOption === 'string'
        ? Source.parsePath<P>(pathOption)
        : Array.isArray(pathOption) ? pathOption : [];
      this.#component = {
        hostName: option.hostName,
        password: option.password || '',
        pathNodes,
        port: option.port || null,
        protocol: option.protocol,
        userName: option.userName || ''
      };
    }
  }

  private validatePathNode(node: PahtNode | PahtNode[]) {
    const list = Array.isArray(node) ? node : [node];
    const existed: Record<string, boolean> = {};
    for (const item of this.#component.pathNodes) {
      if (item.type === 'param') {
        existed[item.name] = true;
      }
    }
    for (const item of list) {
      const name = item.name;
      if (existed[name] === true) {
        throw new Error(`Duplicate name: ${name}`);
      } else if (REG_VALID_PARAM_NAME.test(name) === false) {
        throw new Error(`Illegal parameter name: ${name}`);
      } else {
        existed[name] = true;
      }
    }
  }

  private extend<NP extends string = P>(option: Partial<SourceOption<NP>>) {
    return new Source<NP>({
      hostName: this.#component.hostName,
      password: this.#component.password || undefined,
      port: this.#component.port || undefined,
      protocol: this.#component.protocol || undefined,
      userName: this.#component.userName || undefined,
      path: this.#component.pathNodes.map(item => Object.assign({}, item)) as PahtNode<NP>[],
      ...option,
    });
  }

  get protocol() {
    return this.#component.protocol;
  }

  setProtocol(protocol: Protocol) {
    return this.extend<P>({ protocol });
  }
  get path() {
    const result: string[] = [];
    for (let { name, type } of this.#component.pathNodes) {
      if (name !== '') {
        if (type === 'static') {
          result.push(name);
        } else {
          result.push(PARAMETER_PREFIX + name);
        }
      }
    }
    return result.join(PATH_SEPARATOR);
  }
  setPath<NP extends string = string>(path: PahtNode<NP>[] | string = '') {
    return this.extend<NP>({ path });
  }
  insertPath<EP extends string = string>(
    path: PahtNode<EP> | PahtNode<EP>[] | string,
    index: number = 0
  ): Source<P | EP> {
    const nodes = typeof path === 'string'
      ? Source.parsePath<EP>(path)
      : Array.isArray(path)
        ? path
        : [path];
    if (nodes.length === 0) {
      return this.clone() as Source<P | EP>;
    }
    this.validatePathNode(nodes);
    const rawNodes = this.#component.pathNodes.slice();
    const insertIndex = Math.max(Math.min(index, nodes.length), 0);
    const newNodes = ([] as PahtNode<P | EP>[])
      .concat(rawNodes.slice(0, insertIndex))
      .concat(nodes)
      .concat(rawNodes.slice(insertIndex))
      .map(item => Object.assign({}, item));
    return this.extend<P | EP>({ path: newNodes });
  }
  appendPath<EP extends string = string>(node: PahtNode<EP> | PahtNode<EP>[] | string): Source<P | EP> {
    const length = this.#component.pathNodes.length;
    return this.insertPath(node, length);
  }
  removePath<EP extends string = never>(
    filter: number | ((item: PahtNode<P>, index: number, nodes: PahtNode<P>[]) => boolean)
  ): Source<Exclude<P, EP>> {
    let nodes = this.#component.pathNodes.slice();
    if (typeof filter === 'number') {
      nodes.splice(filter, 1);
    } else {
      nodes = nodes.filter(filter);
    }
    return this.extend<Exclude<P, EP>>({
      path: nodes as PahtNode<Exclude<P, EP>>[]
    });
  }

  get userName() {
    return this.#component.userName;
  }
  setUserName(userName: string = '') {
    return this.extend<P>({ userName });
  }
  get password() {
    return this.#component.password;
  }
  setPassword(password: string = '') {
    return this.extend<P>({ password });
  }
  get port() {
    return this.#component.port;
  }
  setPort(port?: number) {
    return this.extend<P>({ port });
  }
  get hostName() {
    return this.#component.hostName;
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
    let result = origin;
    if (path) {
      result += '/' + path;
    }
    return result;
  }

  toURL(param?: Record<P, string | number>, query: URLSearchParams | QueryLiteral = {}) {
    const pathNodes = this.#component.pathNodes;
    let hrefResult = this.origin;
    if (pathNodes.length !== 0) {
      const pathSegments: string[] = []
      for (let node of pathNodes) {
        if (node.type === 'static') {
          pathSegments.push(node.name);
        } else {
          if (param === undefined || param[node.name] === undefined) {
            throw new Error(`Missing required parameter of path: ${this.toString()}`);
          }
          const paramValue = param[node.name];
          if (typeof paramValue !== 'string' && typeof paramValue !== 'number') {
            throw new Error(`Unexpected type of parameter: ${node.name} in ${this.toString()}`);
          }
          pathSegments.push(String(paramValue));
        }
      }
      hrefResult += ('/' + pathSegments.join(PATH_SEPARATOR));
    }

    const queryString = query instanceof URLSearchParams
      ? query.toString()
      : normalizeQueryLiteral(query).toString()
    if (queryString !== '') {
      hrefResult += '?' + queryString;
    }
    return new URL(hrefResult);
  }

  clone() {
    return this.extend<P>({});
  }
}

export default Source;
