// Default port to use when no valid value is supplied.
const DEFAULT_PORT = 5000;
// Minimum and maximum valid TCP port numbers (excluding 0 which is "any").
const MIN_PORT = 1;
const MAX_PORT = 65535;

function isMissing(val) {
  return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
}

function isStrictIntegerString(val) {
  return typeof val === 'string' && /^-?\d+$/.test(val.trim());
}

/**
 * Verify a port value. Behavior:
 *  - undefined / null / empty string  → return the default (5000)
 *  - "5000" / 5000                    → return the integer
 *  - "5000abc" / 3.14 / "3.14" / -1   → throw RangeError
 *  - 0                                → throw RangeError (port 0 means "any" in
 *                                       listen(); it's not a usable configured
 *                                       value, so we reject it)
 */
export function verifyPort(portVal) {
  if (isMissing(portVal)) return DEFAULT_PORT;

  if (typeof portVal === 'number') {
    if (!Number.isInteger(portVal)) {
      throw new RangeError(`verifyPort: expected integer, got ${portVal}`);
    }
    if (portVal < MIN_PORT || portVal > MAX_PORT) {
      throw new RangeError(`verifyPort: ${portVal} is out of range (${MIN_PORT}-${MAX_PORT})`);
    }
    return portVal;
  }

  if (typeof portVal === 'string') {
    const trimmed = portVal.trim();
    if (!isStrictIntegerString(trimmed)) {
      throw new RangeError(`verifyPort: "${portVal}" is not a valid integer string`);
    }
    const parsed = parseInt(trimmed, 10);
    if (parsed < MIN_PORT || parsed > MAX_PORT) {
      throw new RangeError(`verifyPort: ${parsed} is out of range (${MIN_PORT}-${MAX_PORT})`);
    }
    return parsed;
  }

  throw new TypeError(`verifyPort: expected string|number, got ${typeof portVal}`);
}

export function verifyHost(hostVal) {
  if (typeof hostVal !== 'string' || hostVal.trim() === '') {
    return 'localhost';
  }
  return hostVal.trim();
}
