declare module 'bcryptjs' {
  /**
   * Generate a hash for the plaintext password
   * @param plaintext The plaintext to hash
   * @param salt The salt to use, or number of rounds to generate a salt (default 10)
   * @returns Promise that resolves to the hash
   */
  export function hash(
    plaintext: string,
    salt: string | number
  ): Promise<string>;

  /**
   * Compares a plaintext to a hash, returns whether they match
   * @param plaintext The plaintext to check
   * @param hash The hash to compare against
   * @returns Promise that resolves to true if matching, false otherwise
   */
  export function compare(
    plaintext: string,
    hash: string
  ): Promise<boolean>;

  /**
   * Generate a salt
   * @param rounds Number of rounds to use (default 10)
   * @returns Promise that resolves to the generated salt
   */
  export function genSalt(rounds?: number): Promise<string>;

  /**
   * Synchronous hash generation
   * @param plaintext The plaintext to hash
   * @param salt The salt to use, or number of rounds to generate a salt
   * @returns The generated hash
   */
  export function hashSync(plaintext: string, salt: string | number): string;

  /**
   * Synchronous plaintext comparison
   * @param plaintext The plaintext to check
   * @param hash The hash to compare against
   * @returns true if matching, false otherwise
   */
  export function compareSync(plaintext: string, hash: string): boolean;

  /**
   * Synchronous salt generation
   * @param rounds Number of rounds to use (default 10)
   * @returns The generated salt
   */
  export function genSaltSync(rounds?: number): string;
}
