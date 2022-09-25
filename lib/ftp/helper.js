export default class HelperFTP {
    verbose = false;
    isJson(str) {
        try {
            JSON.parse(str);
        }
        catch (e) {
            return false;
        }
        return true;
    }
    setverbose(v) {
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
export function exitLog(...args) {
    console.log(...args);
    process.exit(1);
}
