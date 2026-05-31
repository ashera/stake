export default function SiteFooter() {
  const build = process.env.BUILD_NUMBER;
  const commit = process.env.COMMIT_ID;
  const builtAt = process.env.BUILT_AT;
  const version = [build ? `v${build}` : null, commit].filter(Boolean).join(" · ");

  return (
    <footer>
      <div>
        Traxn
        {version && (
          <span className="version" title={builtAt ? `Built ${builtAt}` : undefined}>
            {version}
          </span>
        )}
      </div>
      <div>A concierge experiment — humans behind the curtain, on purpose.</div>
    </footer>
  );
}
