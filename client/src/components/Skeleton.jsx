export function Skeleton({ width = '100%', height = '1rem', className = '' }) {
  return <span className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}

function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="section">
      <div className="container section-grid">
        <div className="section-head">
          <Skeleton width="2rem" height="0.8rem" />
          <Skeleton width="60%" height="2.6rem" className="mt-sm" />
        </div>
        <div className="section-body skeleton-stack">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="skeleton-row">
              <Skeleton width="30%" height="0.9rem" />
              <Skeleton width="85%" height="1.4rem" />
              <Skeleton width="70%" height="0.9rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading content">
      <div className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <Skeleton width="12rem" height="0.9rem" />
            <Skeleton width="90%" height="clamp(3rem, 9vw, 7rem)" className="mt-md" />
            <Skeleton width="60%" height="clamp(3rem, 9vw, 7rem)" className="mt-sm" />
            <div className="hero-intro">
              <Skeleton width="100%" height="1rem" />
              <Skeleton width="80%" height="1rem" className="mt-sm" />
            </div>
          </div>
          <div className="hero-photo">
            <Skeleton width="100%" height="auto" className="skeleton-portrait" />
          </div>
        </div>
      </div>
      <SectionSkeleton />
      <SectionSkeleton rows={2} />
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="project-page" aria-busy="true" aria-label="Loading project">
      <div className="container">
        <Skeleton width="8rem" height="0.9rem" />
        <Skeleton width="70%" height="clamp(2.75rem, 8vw, 5.5rem)" className="mt-lg" />
        <Skeleton width="45%" height="1.2rem" className="mt-md" />
        <Skeleton width="100%" height="auto" className="skeleton-cover mt-lg" />
      </div>
    </div>
  );
}
