export type HeadersLiteral = Record<string, string | string[]>;
export function normalizeHeadersLiteral(headersObject: HeadersLiteral) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(headersObject)) {
    if (Array.isArray(value)) {
      headers.delete(key); // clean current value
      for (const item of value) {
        headers.append(key, item);
      }
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}
export function mergeHeaders(base: Headers, source: Headers | HeadersLiteral) {
  const newHeader = new Headers(Array.from(base.entries()));
  if (source instanceof Headers) {
    for (const [key, value] of source.entries()) {
      newHeader.set(key, value);
    }
  } else {
    for (const [key, value] of Object.entries(source)) {
      if (Array.isArray(value)) {
        newHeader.delete(key);
        for (const item of value) {
          newHeader.append(key, item);
        }
      } else {
        newHeader.append(key, value);
      }
    }
  }
  return newHeader;
}

export type QueryLiteral = Record<string, string | number | (string | number)[]>;
export function normalizeQueryLiteral(queryObject: QueryLiteral) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryObject)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams;
}

const HEADER_FIELD_DELIMITER = ':';
const HEADER_VALUE_DELIMITER = ',';
export function parseResponseHeaders(headerText: string) {
  const result = new Headers();
  const headerLines = headerText
    .split(/\r\n?/)
    .map(item => item.trim())
    .filter(item => item !== '');
  for (const line of headerLines) {
    const [_fieldName] = line.split(HEADER_FIELD_DELIMITER);
    const fieldName = _fieldName.trim();
    const fieldValues = line.slice(_fieldName.length, line.length)
      .trim()
      .split(HEADER_VALUE_DELIMITER);
    for (const item of fieldValues) {
      result.append(fieldName, item);
    }
  }
  return result;
}
