export function getAppBuildId() {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.COMMIT_REF ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.APP_VERSION ||
    "dev"
  );
}
