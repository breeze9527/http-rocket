export function forEachIterable<T = unknown>(
  data: Iterable<T>,
  callback: (item: T, index: number, list: T[]) => void
) {
  Array.from(data).forEach(callback);
}

export type HeadersLiteral = Record<string, string | string[]>;

export function normalizeHeadersLiteral(literal: HeadersLiteral) {
  const headers = new Headers();
  forEachIterable(
    Object.entries(literal),
    ([key, value]) => {
      if (Array.isArray(value)) {
        headers.delete(key); // clean current value
        forEachIterable(value, item => {
          headers.append(key, item);
        });
      } else {
        headers.set(key, value);
      }
    }
  );
  return headers;
}

export function mergeHeaders(base: Headers, source: Headers | HeadersLiteral) {
  const newHeader = new Headers(Array.from(base.entries()));
  if (source instanceof Headers) {
    forEachIterable(
      source.entries(),
      ([key, value]) => {
        newHeader.set(key, value);
      }
    );
  } else {
    forEachIterable(
      Object.entries(source),
      ([key, value]) => {
        if (Array.isArray(value)) {
          newHeader.delete(key);
          forEachIterable(value, item => {
            newHeader.append(key, item);
          });
        } else {
          newHeader.append(key, value);
        }
      }
    );
  }
  return newHeader;
}

export type QueryLiteral = Record<string, string | number | (string | number)[]>;

export function normalizeQueryLiteral(literal: QueryLiteral) {
  const searchParams = new URLSearchParams();
  forEachIterable(
    Object.entries(literal),
    ([key, value]) => {
      if (Array.isArray(value)) {
        forEachIterable(value, item => {
          searchParams.append(key, String(item));
        });
      } else {
        searchParams.append(key, String(value));
      }
    }
  );
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
  forEachIterable(headerLines, line => {
    const fieldName = line.split(HEADER_FIELD_DELIMITER)[0].trim();
    const fieldValues = line.slice(fieldName.length, line.length)
      .trim()
      .split(HEADER_VALUE_DELIMITER);
    forEachIterable(fieldValues, item => {
      result.append(fieldName, item);
    });
  });
  return result;
}
