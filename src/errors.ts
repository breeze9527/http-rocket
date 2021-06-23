export class RocketError {
  readonly name: string = 'RocketError';
  readonly message: string;
  constructor(message = '' ) {
    this.message = message;
  }
  toString() {
    const {
      message,
      name
    } = this;
    const nameStr = `[${name}]`;
    if (message) {
      return nameStr + ' ' + this.message;
    } else {
      return nameStr;
    }
  }
}

export class NetworkError extends RocketError {
  name = 'NetworkError';
}

export class TimeoutError extends RocketError {
  name = 'TimeoutError';
}

export class AbortError extends RocketError {
  constructor(message = 'Canceled by user') {
    super(message);
  }
  name = 'AbortError';
}

export class ParseError extends RocketError {
  name = 'ParseError';
  error: Error;
  constructor(error: Error) {
    super(error.message);
    this.error = error;
  }
}
