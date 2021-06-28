type PathSegment<P extends string = string> = {
  name: P;
  type: 'param';
} | {
  name: string;
  type: 'static';
};

const PATH_SEPARATOR = '/';
const PARAMETER_PREFIX = ':';
const REG_VALID_PARAM_NAME = /^[a-z]+$/i;
const REG_EMPTY = /^\s*$/;
function validateParameterName(name: string) {
  if (REG_VALID_PARAM_NAME.test(name) === false) {
    throw new Error(`Illegal parameter name: ${name}`);
  }
}
function parsePath<P extends string>(path: string) {
  const segments: PathSegment<P>[] = [];
  for(const str of path.split(PATH_SEPARATOR)) {
    if (REG_EMPTY.test(str)) {
      continue;
    }
    const node: PathSegment<P> = str[0] === PARAMETER_PREFIX
      ? {
        name: str.slice(1) as P,
        type: 'param'
      }
      : {
        name: str,
        type: 'static'
      }
    segments.push(node);
  }
  return segments;
}

class Path<P extends string = string> {
  static from<P extends string = string>(path: string) {
    return new Path<P>(parsePath(path));
  }
  #segments: PathSegment<P>[] = [];
  constructor(segments: PathSegment<P>[]) {
    this.#segments = segments.map(item => ({...item}));
  }
  private validateSegment(segments: PathSegment | PathSegment[]) {
    const list = Array.isArray(segments) ? segments : [segments];
    const existed: Record<string, boolean> = {};
    for(const item of this.#segments) {
      if (item.type === 'param') {
        existed[item.name] = true;
      }
    }
    for(const item of list) {
      const name = item.name;
      validateParameterName(name);
      if (existed[name] === true) {
        throw new Error(`Duplicate name: ${name}`);
      } else {
        existed[name] = true;
      }
    }
  }
  get segments() {
    return this.#segments.map(item => ({...item}));
  }
  insert<EP extends string = string>(node: PathSegment<EP> | PathSegment<EP>[] | string, index: number = 0): Path<P | EP> {
    const segments = typeof node === 'string'
      ? parsePath<EP>(node)
      : Array.isArray(node)
        ? node
        : [node];
    if (segments.length === 0) {
      return this.clone() as Path<P | EP>;
    }
    this.validateSegment(segments);
    const rawSegments = this.#segments.slice();
    const insertIndex = Math.max(Math.min(index, segments.length), 0);
    const newSegments = ([] as PathSegment<P | EP>[])
      .concat(rawSegments.slice(0, insertIndex))
      .concat(segments)
      .concat(rawSegments.slice(insertIndex));
    return new Path(newSegments);
  }
  remove<EP extends string = never>(
    filter: number | ((item: PathSegment<P>, index: number, segments: PathSegment<P>[]) => boolean)
  ): Path<Exclude<P, EP>> {
    let newSegments = this.#segments.slice();
    if (typeof filter === 'number') {
      newSegments.splice(filter, 1);
    } else {
      newSegments = newSegments.filter(filter);
    }
    return new Path(newSegments as PathSegment<Exclude<P, EP>>[]);
  }
  append<EP extends string = string>(node: PathSegment<EP> | PathSegment<EP>[] | string): Path<P | EP> {
    const segments = typeof node === 'string'
      ? parsePath<EP>(node)
      : Array.isArray(node)
        ? node
        : [node];
    if (segments.length === 0) {
      return this.clone() as Path<P | EP>;
    }
    this.validateSegment(segments);
    return new Path(
      ([] as PathSegment<P | EP>[])
      .concat(this.segments)
      .concat(segments)
    );
  }
  toString() {
    let result: string[] = [];
    for(let {name, type} of this.#segments) {
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
  normalize(param?: Record<P, string | number>) {
    let result: string[] = [];
    for (let segment of this.#segments) {
      if (segment.type === 'static') {
        result.push(segment.name);
      } else {
        const paramValue = param?.[segment.name];
        if (paramValue === undefined) {
          throw new Error(`Missing required parameter of path: ${this.toString()}`);
        }
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number') {
          throw new Error(`Unexpected type of parameter: ${name} in ${this.toString()}`);
        }
        result.push(String(paramValue));
      }
    }
    return result.join(PATH_SEPARATOR);
  }
  clone(): Path<P> {
    return new Path<P>(this.#segments);
  }
}

export default Path;
