export class BTUError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BTUError';
  }
}

export class IRCodeError extends BTUError {
  constructor(message: string) {
    super(message);
    this.name = 'IRCodeError';
  }
}

export class CompressionError extends BTUError {
  constructor(message: string) {
    super(message);
    this.name = 'CompressionError';
  }
}

export class JSONValidationError extends BTUError {
  constructor(message: string) {
    super(message);
    this.name = 'JSONValidationError';
  }
}
