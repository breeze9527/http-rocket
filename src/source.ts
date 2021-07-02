import {
  QueryLiteral,
  forEachIterable,
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
const REG_MATCH_HREF = /^(https?):\/\/(?:([^:@/]+)(?::([^:@/]+))?@)?([^/:]+)(?::(\d+))?(?:\/([^?]+)*)?$/;
//                       protocol     username    password          host    port       path

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
    forEachIterable(path.split(PATH_SEPARATOR), str => {
      if (!REG_EMPTY.test(str)) {
        const node: PahtNode<P> = str[0] === PARAMETER_PREFIX
          ? {
            name: str.slice(1) as P,
            type: 'param'
          }
          : {
            name: str,
            type: 'static'
          };
        nodes.push(node);
      }
    });
    return nodes;
  }

  constructor(option: SourceOption<P> | string) {
    if (typeof option === 'string') {
      const regMatchResult = REG_MATCH_HREF.exec(option);
      if (regMatchResult === null) {
        throw new Error(`Illegal source: ${option}`);
      } else {
        const [
          protocol,
          userName = '',
          password = '',
          hostName,
          port,
          path
        ] = regMatchResult.slice(1);
        this.#component = {
          hostName,
          password,
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

  private extend<NP extends string = P>(option: Partial<SourceOption<NP>>) {
    return new Source<NP>({
      hostName: this.#component.hostName,
      password: this.#component.password || undefined,
      path: this.#component.pathNodes.map(item => ({ ...item })) as PahtNode<NP>[],
      port: this.#component.port || undefined,
      protocol: this.#component.protocol || undefined,
      userName: this.#component.userName || undefined,
      ...option
    });
  }

  private validatePathNode(node: PahtNode | PahtNode[]) {
    const list = Array.isArray(node) ? node : [node];
    const existed: Record<string, boolean> = {};
    forEachIterable(this.#component.pathNodes, item => {
      if (item.type === 'param') {
        existed[item.name] = true;
      }
    });
    forEachIterable(list, item => {
      const name = item.name;
      if (existed[name] === true) {
        throw new Error(`Duplicate name: ${name}`);
      } else if (REG_VALID_PARAM_NAME.test(name) === false) {
        throw new Error(`Illegal parameter name: ${name}`);
      } else {
        existed[name] = true;
      }
    });
  }

  get hostName() {
    return this.#component.hostName;
  }

  get password() {
    return this.#component.password;
  }

  get path() {
    const result: string[] = [];
    forEachIterable(this.#component.pathNodes, ({ name, type }) => {
      if (name !== '') {
        if (type === 'static') {
          result.push(name);
        } else {
          result.push(PARAMETER_PREFIX + name);
        }
      }
    });
    return result.join(PATH_SEPARATOR);
  }

  get port() {
    return this.#component.port;
  }

  get protocol() {
    return this.#component.protocol;
  }

  get userName() {
    return this.#component.userName;
  }

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

  appendPath<EP extends string = string>(
    node: PahtNode<EP> | PahtNode<EP>[] | string
  ): Source<P | EP> {
    const length = this.#component.pathNodes.length;
    return this.insertPath(node, length);
  }

  clone() {
    return this.extend<P>({});
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
      .map(item => ({ ...item }));
    return this.extend<P | EP>({ path: newNodes });
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

  setHostName(hostName: string) {
    return this.extend<P>({ hostName });
  }

  setOrigin(origin: string) {
    const regMatchResult = REG_MATCH_HREF.exec(origin);
    if (regMatchResult === null) {
      throw new Error(`Illegal origin: ${origin}`);
    } else {
      const [
        protocol,
        userName = '',
        password = '',
        hostName,
        port
      ] = regMatchResult.slice(1);
      const options: Partial<SourceOption<P>> = {
        hostName,
        password,
        protocol: protocol as Protocol,
        userName
      };
      if (port) {
        options.port = parseInt(port, 10);
      }
      return this.extend<P>(options);
    }
  }

  setPassword(password: string = '') {
    return this.extend<P>({ password });
  }

  setPath<NP extends string = string>(path: PahtNode<NP>[] | string = '') {
    return this.extend<NP>({ path });
  }

  setPort(port?: number) {
    return this.extend<P>({ port });
  }

  setProtocol(protocol: Protocol) {
    return this.extend<P>({ protocol });
  }

  setUserName(userName: string = '') {
    return this.extend<P>({ userName });
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

  toURL(
    param?: Record<P, string | number>,
    query: URLSearchParams | QueryLiteral = {}
  ) {
    const pathNodes = this.#component.pathNodes;
    let hrefResult = this.origin;
    if (pathNodes.length !== 0) {
      const pathSegments: string[] = [];
      forEachIterable(pathNodes, node => {
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
      });
      hrefResult += ('/' + pathSegments.join(PATH_SEPARATOR));
    }
    const queryString = query instanceof URLSearchParams
      ? query.toString()
      : normalizeQueryLiteral(query).toString();
    if (queryString !== '') {
      hrefResult += '?' + queryString;
    }
    return new URL(hrefResult);
  }
}

export default Source;
