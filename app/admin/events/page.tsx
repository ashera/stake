import { getEvents } from "@/lib/events";
import LocalDateTime from "./LocalDateTime";

export const dynamic = "force-dynamic";

export default async function AdminEvents() {
  const events = await getEvents(200);

  return (
    <section>
      <div className="admin-head">
        <h1>Events</h1>
        <span className="count">last {events.length}</span>
      </div>
      <p className="lede">
        Recent app activity — emails, deals, sign-ins, and deploy migrations. Newest first.
        This is the in-app view of what would otherwise only be in the Railway logs.
      </p>

      {events.length === 0 ? (
        <div className="empty">No events yet.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Level</th>
              <th>Type</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="muted">
                  <LocalDateTime iso={e.createdAt} />
                </td>
                <td>
                  <span className={`pill lvl lvl-${e.level}`}>{e.level}</span>
                </td>
                <td className="muted">{e.type}</td>
                <td>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
