export default class HelperFTP {
  private verbose = false;
  isJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  setverbose(v: boolean) {
    this.verbose = v;
    return this;
  }
  isverbose = () => this.verbose;
}
export const isWin = process.platform === 'win32';
/**
 * log and exit
 * @param args
 */
export function exitLog(...args: any[]) {
  console.log(...args);
  process.exit(1);
}
