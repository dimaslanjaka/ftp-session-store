/**
 * get millis of given days
 * @param n
 * @returns
 */
export function day2millis(n: number) {
  return n * 24 * 3600 * 1000;
}

export function hour2millis(n: number) {
  return n * 60 * 1000;
}
