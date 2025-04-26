/**
 * This is a stub implementation of bcrypt for client-side code.
 * It does not actually do anything, but prevents client-side errors.
 * The real bcrypt will only be used on the server.
 */

export function compare() {
  throw new Error('bcrypt.compare is not available on the client side');
}

export function hash() {
  throw new Error('bcrypt.hash is not available on the client side');
}

const bcryptStub = {
  compare,
  hash,
};

export default bcryptStub; 