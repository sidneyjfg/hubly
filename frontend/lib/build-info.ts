type BuildInfo = {
  commitSha: string | null;
  label: string;
  version: string;
};

const fallbackVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0-dev";
const buildVersion = fallbackVersion.trim().length > 0 ? fallbackVersion : "0.1.0-dev";
const buildCommitSha = process.env.NEXT_PUBLIC_APP_COMMIT_SHA?.trim() || null;

export function getBuildInfo(): BuildInfo {
  const shortSha = buildCommitSha ? buildCommitSha.slice(0, 7) : null;

  return {
    version: buildVersion,
    commitSha: buildCommitSha,
    label: shortSha ? `${buildVersion} (${shortSha})` : buildVersion,
  };
}
