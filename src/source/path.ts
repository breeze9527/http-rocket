type PathSegmentType = 'param' | 'static';
interface PathSegment {
  name: string;
  type: PathSegmentType;
}

const PATH_SEPARATOR = '/';
const PARAMETER_PREFIX = ':';
const REG_VALID_PARAM_NAME = /^[a-z]+$/i;
const REG_EMPTY = /^\s*$/;
function validateParameterName(name: string) {
  if (REG_VALID_PARAM_NAME.test(name) === false) {
    throw new Error(`Illegal parameter name: ${name}`);
  }
}
function parsePath(path: string) {
  const segments: PathSegment[] = [];
  for(const str of path.split(PATH_SEPARATOR)) {
    if (REG_EMPTY.test(str)) {
      continue;
    }
    const node: PathSegment = PARAMETER_PREFIX
      ? {
        name: str.slice(1),
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

class Path {
  static from(path: string) {
    return new Path(parsePath(path));
  }
  #segments: PathSegment[] = [];
  constructor(segments: PathSegment[]) {
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
  insert(node: PathSegment | PathSegment[] | string, index: number = 0): void {
    const segments = typeof node === 'string'
      ? parsePath(node)
      : Array.isArray(node)
        ? node
        : [node];
    if (segments.length === 0) {
      return;
    }
    this.validateSegment(segments);
    const rawSegments = this.#segments.slice();
    const insertIndex = Math.max(Math.min(index, segments.length), 0);
    this.#segments = rawSegments.slice(0, insertIndex)
      .concat(segments)
      .concat(rawSegments.slice(insertIndex));
  }
  remove(filter: number | ((item: PathSegment, index: number, segments: PathSegment[]) => boolean)) {
    let segments = this.#segments;
    if (typeof filter === 'number') {
      segments.splice(filter, 1);
    } else {
      segments = segments.filter(filter);
    }
    this.#segments = segments;
  }
  append(node: PathSegment | PathSegment[] | string): void {
    const segments = typeof node === 'string'
      ? parsePath(node)
      : Array.isArray(node)
        ? node
        : [node];
    if (segments.length === 0) {
      return;
    }
    this.validateSegment(segments);
    this.#segments = this.#segments.concat(segments);
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
  normalize(params: Record<string, string | number> = {}) {
    let result: string[] = [];
    for (let {name, type} of this.#segments) {
      if (name !== '') {
        if (type === 'static') {
          result.push(name);
        } else {
          const paramValue = params[name];
          if (paramValue === undefined) {
            throw new Error(`Missing required parameter of path: ${this.toString()}`);
          }
          if (typeof paramValue !== 'string' && typeof paramValue !== 'number') {
            throw new Error(`Unexpected type of parameter: ${name} in ${this.toString()}`);
          }
          result.push(String(paramValue));
        }
      }
    }
    return result.join(PATH_SEPARATOR);
  }
  clone() {
    return new Path(this.#segments);
  }
}

export default Path;
