type PathSegmentType = 'param' | 'static';
interface PathSegment {
  name: string;
  type: PathSegmentType;
}

const PATH_SEPARATOR = '/';
const PARAMETER_PREFIX = ':';
const REG_VALID_PARAM_NAME = /^[a-z]+$/i;
function validateParameterName(name: string) {
  if (REG_VALID_PARAM_NAME.test(name) === false) {
    throw new Error(`Illegal parameter name: ${name}`);
  }
}
class Path {
  /**
   * create Path object from path string like source/of/:id
   * @param path path string
   */
  static from(path: string) {
    const segments: PathSegment[] = [];
    for(const _str of path.split(PATH_SEPARATOR)) {
      const str = _str.trim();
      if (str !== '') {
        if (str[0] === PARAMETER_PREFIX) {
          const parameterName = str.slice(1);
          validateParameterName(parameterName);
          segments.push({
            name: parameterName,
            type: 'param'
          });
        } else {
          segments.push({
            name: str,
            type: 'static'
          });
        }
      }
    }
    return new Path(segments);
  }
  #segments: PathSegment[] = [];
  constructor(segments: PathSegment[]) {
    this.#segments = segments.map(item => ({...item}));
  }
  private validateItem({name, type}: PathSegment) {
    if (type === 'param') {
      validateParameterName(name);
      if (this.#segments.some(item => name === item.name)) {
        throw new Error(`Duplicate name: ${name}`);
      }
    }
  }
  get segments() {
    return this.#segments.map(item => ({...item}));
  }
  insert(item: PathSegment, index?: number): void;
  insert(type: PathSegmentType, name: string, index?: number): void;
  insert(_itemOrType: PathSegment | PathSegmentType, _indexOrName?: number | string, _index?: number): void {
    let item: PathSegment;
    let index: number = 0;
    if (typeof _itemOrType === 'string') {
      item = {
        name: _indexOrName as string,
        type: _itemOrType
      };
      index = _index || 0;
    } else {
      item = _itemOrType;
      index = (_indexOrName as number) || 0;
    }
    this.validateItem(item);
    const segments = this.#segments.slice();
    const insertIndex = Math.max(Math.min(index, segments.length), 0);
    segments.splice(insertIndex, 0, item);
    this.#segments = segments;
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
  append(item: PathSegment): void;
  append(type: PathSegmentType, name: string): void;
  append(_itemOrType: PathSegment | PathSegmentType, _name?: string): void {
    const item: PathSegment = typeof _itemOrType === 'string' && typeof _name === 'string'
      ? {
        name: _name,
        type: _itemOrType
      }
      : _itemOrType as PathSegment
    this.validateItem(item);
    this.#segments = this.#segments.concat(item);
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
            throw new Error(`Unexpected value type of pamameter: ${name} in ${this.toString()}`);
          }
          result.push(String(paramValue));
        }
      }
    }
    return result.join(PATH_SEPARATOR);
  }
}

export default Path;
