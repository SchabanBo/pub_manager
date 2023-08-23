import axios from 'axios';

export interface PackageData {
    latestVersion: string;
    publishedDate: string;
}

export async function fetchPackageData(packageName: string): Promise<PackageData> {
    try {
        const response = await axios.get(`https://pub.dev/api/packages/${packageName}`);
        const latestVersion = response.data.latest.version;
        const versionInfo = await axios.get(`https://pub.dev/api/packages/${packageName}/versions/${latestVersion}`);
        const publishedDate = new Date(versionInfo.data.published).toLocaleDateString();
        return {
            latestVersion,
            publishedDate,
        };
    } catch (error) {
        console.error(`Error fetching package data for ${packageName}:`, error);
        return {
            latestVersion: '',
            publishedDate: '',
        };
    }
}

export function modifyPubspecContent(pubspecContent: string, packageName: string, newVersion: string): string {
    const lines = pubspecContent.split('\n');
    const updatedLines = lines.map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith(packageName + ':')) {
            const currentVersionMatch = trimmedLine.match(/[\d.]+/);
            if (currentVersionMatch) {
                const currentVersion = currentVersionMatch[0];
                return line.replace(currentVersion, newVersion);
            }
        }
        return line;
    });
    return updatedLines.join('\n');
}

export function removeDependency(pubspecContent: string, packageName: string): string {
    const lines = pubspecContent.split('\n');
    const updatedLines = lines.filter((line) => {
        const trimmedLine = line.trim();
        return !trimmedLine.startsWith(packageName + ':');
    });
    return updatedLines.join('\n');
}