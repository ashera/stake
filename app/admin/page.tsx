import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  name: string;
  email: string;
  link: string | null;
  proof: string | null;
  niche: string | null;
  revshare: string | null;
  created_at: string;
};

async function getApplications(): Promise<Application[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    `SELECT id, name, email, link, proof, niche, revshare, created_at
       FROM applications
      ORDER BY created_at DESC`
  );
  return rows as Application[];
}

function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminApplications() {
  const applications = await getApplications();

  return (
    <section>
      <div className="admin-head">
        <h1>Applications</h1>
        <span className="count">{applications.length} total</span>
      </div>
      <p className="lede">
        Every marketer who applied for the Frockd spot. This is the demand signal —
        watch the rate and the quality.
      </p>

      {applications.length === 0 ? (
        <div className="empty">No applications yet.</div>
      ) : (
        <div className="cards">
          {applications.map((a) => (
            <article className="app-card" key={a.id}>
              <div className="app-card-top">
                <div>
                  <h3>{a.name}</h3>
                  <a href={`mailto:${a.email}`} className="muted-link">
                    {a.email}
                  </a>
                </div>
                <span className="date">{fmtDate(a.created_at)}</span>
              </div>
              {a.proof && <p className="proof">{a.proof}</p>}
              <div className="app-meta">
                {a.niche && (
                  <span className="pill">
                    <span className="pill-k">Niche</span> {a.niche}
                  </span>
                )}
                {a.revshare && (
                  <span className="pill">
                    <span className="pill-k">Rev-share</span> {a.revshare}
                  </span>
                )}
                {a.link && (
                  <a className="pill pill-link" href={a.link} target="_blank" rel="noreferrer">
                    Link ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
