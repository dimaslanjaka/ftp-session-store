'use strict';
// import * as childProcess from 'child_process';
// const exec = childProcess.exec;
// declare module 'kill-process-by-name'
import { exec } from 'child_process';
export function killProcessByName(programname) {
    switch (process.platform) {
        case 'win32':
            exec('taskkill /F /IM ' + programname + '.exe /T');
            break;
        default: //Linux + Darwin
            exec('pkill -f ' + programname);
            break;
    }
}
export default killProcessByName;
