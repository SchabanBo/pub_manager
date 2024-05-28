import axios from "axios";
import { PackageData } from "../models";



export async function fetchPackageData(packageName: string): Promise<PackageData> {
    try {
        const response = await axios.get(`https://pub.dev/api/packages/${packageName}`);
        const latestVersion = response.data.latest.version;
        const description = response.data.latest.pubspec.description;
        const publishedDate = new Date(response.data.latest.published).toLocaleDateString();
        const metrics = await axios.get(`https://pub.dev/api/packages/${packageName}/metrics`);
        const tags = metrics.data.score.tags;
        const platformTags = tags
            .filter((tag: string) => tag.startsWith('platform:'))
            .map((tag: string) => tag.replace('platform:', ''));
        const isTags = tags
            .filter((tag: string) => tag.startsWith('is:'))
            .map((tag: string) => tag.replace('is:', ''));;
        const licenses = tags
            .filter((tag: string) => tag.startsWith('license:'))
            .map((tag: string) => tag.replace('license:', ''));;
        return {
            latestVersion,
            publishedDate,
            description,
            platformTags,
            isTags,
            licenses,
        };
    } catch (error) {
        console.error(`Error fetching package data for ${packageName}:`, error);
        return {
            latestVersion: '',
            publishedDate: '',
            description: '',
            platformTags: [],
            isTags: [],
            licenses: [],
        };
    }
}


