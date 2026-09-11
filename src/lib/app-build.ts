export function getAppBuildId() {
  return (
    process.env.NEXT_PUBLIC_APP_BUILD ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.COMMIT_REF ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.APP_VERSION ||
    "dev"
  );
}

export function resolveDeployBuildId() {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.COMMIT_REF ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.APP_VERSION ||
    "dev"
  );
}

export function isStaleClientBuild({
  live,
  html = "",
  baked = "",
  previous = null,
}: {
  live: string;
  html?: string;
  baked?: string;
  previous?: string | null;
}) {
  if (!live) return false;
  if (previous && previous !== live) return true;
  if (html && html !== live) return true;
  if (baked && baked !== live) return true;
  return false;
}
