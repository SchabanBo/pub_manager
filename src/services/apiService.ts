import axios from "axios";

export interface PackageData {
    latestVersion: string;
    publishedDate: string;
    supposedPlatforms: string[];
    dart3Compatible: boolean;
}

export async function fetchPackageData(packageName: string): Promise<PackageData> {
    try {
        const response = await axios.get(`https://pub.dev/api/packages/${packageName}`);
        const latestVersion = response.data.latest.version;
        const publishedDate = new Date(response.data.latest.published).toLocaleDateString();
        const metrics = await axios.get(`https://pub.dev/api/packages/${packageName}/metrics`);
        const tags = metrics.data.score.tags;
        const supposedPlatforms = tags
            .filter((tag: string) => tag.startsWith('platform:'))
            .map((tag: string) => tag.replace('platform:', ''));
        const dart3Compatible = tags.includes('is:dart3-compatible');
        return {
            latestVersion,
            publishedDate,
            supposedPlatforms,
            dart3Compatible,
        };
    } catch (error) {
        console.error(`Error fetching package data for ${packageName}:`, error);
        return {
            latestVersion: '',
            publishedDate: '',
            supposedPlatforms: [],
            dart3Compatible: false,
        };
    }
}

