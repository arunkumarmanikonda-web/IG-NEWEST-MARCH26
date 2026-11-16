"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Schedule({ settings, nextRun, topics }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [cadence, setCadence] = useState(settings.cadence_days);
  const [topic, setTopic] = useState(settings.preferred_topic || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const changed = enabled !== settings.enabled || cadence !== settings.cadence_days ||
    topic.trim() !== (settings.preferred_topic || "");
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60000);
    return () => clearInterval(timer);
  }, [router]);

  async function submit(event) {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || "settings";
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/intelligence", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, enabled, cadence_days: cadence, preferred_topic: topic }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not update the schedule.");
      setMessage(action === "queue" ? "Research requested. The next worker cycle will pick it up." : "Publication schedule saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof SyntaxError ? "Could not read the response. Refresh the workspace." : error.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="workspace-card" aria-labelledby="ig-publication-schedule">
    <h3 id="ig-publication-schedule">Publication schedule</h3>
    <p>{settings.enabled ? "Next research run · " + nextRun : "Scheduled publication is paused."}</p>
    <form className="workspace-form" onSubmit={submit}>
      <label>Publication frequency
        <select disabled={busy} value={cadence} onChange={event => setCadence(Number(event.target.value))}>
          <option value={7}>Weekly</option><option value={14}>Fortnightly</option>
        </select>
      </label>
      <label>Preferred topic (optional)
        <input disabled={busy} list="ig-topic-suggestions" value={topic} maxLength={200}
          onChange={event => setTopic(event.target.value)} placeholder="Let the engine choose a topic" />
        <datalist id="ig-topic-suggestions">{topics.map(t => <option value={t} key={t} />)}</datalist>
      </label>
      <label className="check wide"><input type="checkbox" disabled={busy} checked={enabled}
        onChange={event => setEnabled(event.target.checked)} /> Enable automatic research and publication</label>
      <div className="workspace-actions wide">
        <button className="primary" type="submit" value="settings" disabled={busy || !changed}>Save schedule</button>
        <button type="submit" value="queue" disabled={busy || changed || !settings.enabled}>Run research now</button>
      </div>
    </form>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
