import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { supabase } from "../lib/supabaseClient";
import { useSession, useBeat, useSubmissions, useParticipants } from "../lib/hooks";
import { generateRoomCode } from "../lib/roomCode";

function HostPicker() {
  const [exercises, setExercises] = useState([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("exercises").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setExercises(data || []));
  }, []);

  async function startSession(exerciseId) {
    setCreating(true);
    // find the first beat: lowest scenario order, then lowest beat order
    const { data: scenarios } = await supabase
      .from("scenarios").select("id").eq("exercise_id", exerciseId).order("order").limit(1);
    if (!scenarios?.length) { setCreating(false); return; }
    const { data: beats } = await supabase
      .from("beats").select("id").eq("scenario_id", scenarios[0].id).order("order").limit(1);
    const firstBeatId = beats?.[0]?.id ?? null;

    const room_code = generateRoomCode();
    const { data: session, error } = await supabase
      .from("sessions")
      .insert({ exercise_id: exerciseId, room_code, status: "live", current_beat_id: firstBeatId, started_at: new Date().toISOString() })
      .select().single();

    setCreating(false);
    if (!error) navigate(`/host/${session.id}`);
  }

  return (
    <div className="page center">
      <h1>Start a session</h1>
      {exercises.length === 0 && <p className="muted">No exercises found yet.</p>}
      <div className="stack">
        {exercises.map((ex) => (
          <button key={ex.id} className="card-btn" disabled={creating} onClick={() => startSession(ex.id)}>
            {ex.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function HostConsole({ sessionId }) {
  const { session } = useSession(sessionId);
  const { beat, scenario, prompts } = useBeat(session?.current_beat_id);
  const submissions = useSubmissions(sessionId);
  const participants = useParticipants(sessionId);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/r/${session?.room_code ?? ""}`;

  async function advance() {
    if (!beat?.next_beat_id) return;
    await supabase.from("sessions").update({ current_beat_id: beat.next_beat_id }).eq("id", sessionId);
  }

  async function endSession() {
    await supabase.from("sessions").update({ status: "ended" }).eq("id", sessionId);
  }

  if (!session) return <div className="page center"><p>Loading session…</p></div>;

  return (
    <div className="page host">
      <header className="host-top">
        <div>
          <div className="room-code">{session.room_code}</div>
          <div className="muted">{participants.length} joined</div>
        </div>
        <div className="qr-box">
          <QRCode value={joinUrl} size={96} />
          <div className="muted small">{joinUrl}</div>
        </div>
      </header>

      {session.status === "ended" ? (
        <div className="center"><h2>Session ended</h2></div>
      ) : !beat ? (
        <div className="center"><p>Loading beat…</p></div>
      ) : (
        <>
          <section className="beat-card" style={{ borderColor: scenario ? `#${scenario.accent}` : undefined }}>
            {scenario && <div className="scenario-title" style={{ color: `#${scenario.accent}` }}>{scenario.title}</div>}
            <div className="beat-label">{beat.type.toUpperCase()} {beat.time_label && `· ${beat.time_label}`}</div>
            <p className="beat-body">{beat.body_text}</p>
          </section>

          {prompts.map((p) => {
            const responses = submissions.filter((s) => s.prompt_id === p.id);
            return (
              <section key={p.id} className="prompt-card">
                <div className="prompt-question">{p.question_text}</div>
                <div className="response-feed">
                  {responses.length === 0 && <div className="muted small">No responses yet</div>}
                  {responses.map((r) => (
                    <div key={r.id} className="response-item">
                      <div className="response-text">{r.mc_choice ?? r.free_text}</div>
                      <div className="response-meta">
                        {r.participants?.display_name}
                        <span className="muted"> — {r.participants?.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <footer className="host-actions">
            {beat.next_beat_id ? (
              <button className="primary" onClick={advance}>Next →</button>
            ) : (
              <button className="primary" onClick={endSession}>End session</button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

export default function Host() {
  const { sessionId } = useParams();
  return sessionId ? <HostConsole sessionId={sessionId} /> : <HostPicker />;
}
