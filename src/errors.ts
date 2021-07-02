/* eslint-disable max-classes-per-file */

export class RocketError {
  readonly message: string;
  readonly name: string = 'RocketError';

  constructor(message = '') {
    this.message = message;
  }

  toString() {
    const {
      message,
      name
    } = this;
    const nameStr = `[${name}]`;
    return message
      ? nameStr + ' ' + this.message
      : nameStr;
  }
}

export class NetworkError extends RocketError {
  name = 'NetworkError';
}

export class TimeoutError extends RocketError {
  name = 'TimeoutError';
}

export class AbortError extends RocketError {
  name = 'AbortError';

  constructor(message = 'Canceled by user') {
    super(message);
  }
}

export class ParseError extends RocketError {
  error: Error;
  name = 'ParseError';

  constructor(error: Error) {
    super(error.message);
    this.error = error;
  }
}
