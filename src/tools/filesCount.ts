import * as fs from 'fs';

/// this function is used to count the number of the dart files in the lib directory
export function filesCount(path: string): number {
    let count = 0;
    const files = fs.readdirSync(path);
    files.forEach((file) => {
        const filePath = path + '/' + file;
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            if (file.endsWith('.dart')) {
                count++;
            }
        } else if (stat.isDirectory()) {
            count += filesCount(filePath);
        }
    });
    return count;
}
