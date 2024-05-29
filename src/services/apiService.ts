import axios from "axios";
import { PackageData } from "../models";
import { runCommand, runCommandInCurrentDire } from "../helpers/utils";
import { Container } from "../helpers/container";

export async function fetchPackageData(
  packageName: string
): Promise<PackageData> {
  try {
    const response = await axios.get(
      `https://pub.dev/api/packages/${packageName}`
    );
    const latestVersion = response.data.latest.version;
    const description = response.data.latest.pubspec.description;
    const publishedDate = new Date(
      response.data.latest.published
    ).toLocaleDateString();
    const metrics = await axios.get(
      `https://pub.dev/api/packages/${packageName}/metrics`
    );
    const tags = metrics.data.score.tags;
    const platformTags = tags
      .filter((tag: string) => tag.startsWith("platform:"))
      .map((tag: string) => tag.replace("platform:", ""));
    const isTags = tags
      .filter((tag: string) => tag.startsWith("is:"))
      .map((tag: string) => tag.replace("is:", ""));
    const licenses = tags
      .filter((tag: string) => tag.startsWith("license:"))
      .map((tag: string) => tag.replace("license:", ""));
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
      latestVersion: "",
      publishedDate: "",
      description: "",
      platformTags: [],
      isTags: [],
      licenses: [],
    };
  }
}

export async function fetchOutdatedData(): Promise<void> {
  try {
    const datStr = await runCommandInCurrentDire("dart pub outdated --json");
    const data = JSON.parse(datStr).packages as any[];
    for (const packageData of data) {
      const name = packageData.package;
      const localPackage = Container.cache.packages.find((p) => p.name === name);
      if (!localPackage) {
        continue;
      }
      const resolvable = packageData.resolvable.version;
      const latest = localPackage.data?.latestVersion;
      if (resolvable !== latest) {
        localPackage.data!.resolvable = resolvable;
      }
    }
    Container.cache.ready = true;
    Container.getPanelService().update();
  } catch (error) {
    console.error("Error running pub outdated command:", error);
  }
}
