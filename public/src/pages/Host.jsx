import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { supabase } from "../lib/supabaseClient";
import { useSession, useBeat, useSubmissions, useParticipants } from "../lib/hooks";
import { generateRoomCode } from "../lib/roomCode";
import Stage from "../components/Stage";
import ChatFeed from "../components/ChatFeed";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function HostPicker() {
  const [exercises, setExercises] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  function loadLiveSessions() {
    supabase
      .from("sessions")
      .select("*, exercises(title)")
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .then(({ data }) => setLiveSessions(data || []));
  }

  useEffect(() => {
    supabase.from("exercises").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setExercises(data || []));
    loadLiveSessions();
  }, []);

  async function startSession(exerciseId) {
    setCreating(true);
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

  async function endFromList(e, id) {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from("sessions").update({ status: "ended" }).eq("id", id);
    setLiveSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="page center">
      <h1>Host</h1>

      {liveSessions.length > 0 && (
        <>
          <div className="section-label">Resume a live session</div>
          <div className="stack">
            {liveSessions.map((s) => (
              <Link key={s.id} to={`/host/${s.id}`} className="card-btn session-row">
                <div>
                  <div className="card-btn-title">{s.room_code}</div>
                  <div className="muted small">{s.exercises?.title}</div>
                </div>
                <button className="end-btn" onClick={(e) => endFromList(e, s.id)} title="End this session">End</button>
              </Link>
            ))}
          </div>
          <div className="divider">or start new</div>
        </>
      )}

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

function useResolvedSessionId(param) {
  const [resolvedId, setResolvedId] = useState(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!param) return;
    let active = true;

    if (UUID_RE.test(param)) {
      setResolvedId(param);
      return;
    }

    supabase.from("sessions").select("id").eq("room_code", param.toUpperCase()).single()
      .then(({ data }) => {
        if (!active) return;
        if (data) setResolvedId(data.id);
        else { setResolvedId(null); setNotFound(true); }
      });

    return () => { active = false; };
  }, [param]);

  return { resolvedId, notFound };
}

function HostConsole({ sessionId }) {
  const { session } = useSession(sessionId);
  const { beat, scenario, prompts } = useBeat(session?.current_beat_id);
  const submissions = useSubmissions(sessionId);
  const participants = useParticipants(sessionId);
  const navigate = useNavigate();

  const joinUrl = `${window.location.origin}${window.location.pathname}#/r/${session?.room_code ?? ""}`;
  const onLastBeat = beat && !beat.next_beat_id;
  const inOpenFloor = session && session.current_beat_id === null;

  async function advance() {
    if (beat?.next_beat_id) {
      await supabase.from("sessions").update({ current_beat_id: beat.next_beat_id }).eq("id", sessionId);
    } else if (onLastBeat) {
      await supabase.from("sessions").update({ current_beat_id: null }).eq("id", sessionId);
    }
  }

  async function endSession() {
    if (!window.confirm("End this session? Participants will be disconnected.")) return;
    await supabase.from("sessions").update({ status: "ended" }).eq("id", sessionId);
    navigate("/host");
  }

  if (!session) return <div className="page center"><p>Loading session…</p></div>;

  return (
    <div className="host-shell">
      <div className="host-main">
        <header className="header-bar">
          <div className="header-left">
            <Link to="/host" className="back-link">← All sessions</Link>
            <div className="room-code">{session.room_code}</div>
            <span className="muted small">{participants.length} joined</span>
            {session.status !== "ended" && (
              <button className="end-session-link" onClick={endSession}>End session</button>
            )}
          </div>
          <div className="qr-box">
            <QRCode value={joinUrl} size={56} />
            <div className="muted small">{joinUrl}</div>
          </div>
        </header>

        {session.status === "ended" ? (
          <div className="center"><h2>Session ended</h2></div>
        ) : inOpenFloor ? (
          <>
            <Stage beat={null} scenario={{ title: "", accent: "F7941D", scene_image: "scene_hotwash" }}>
              <div className="open-floor-text">
                <h2>Open Floor</h2>
                <p>Questions, further discussion, anything else. End the session when you're ready.</p>
              </div>
            </Stage>
            <footer className="footer-bar">
              <button className="primary" onClick={endSession}>End session</button>
            </footer>
          </>
        ) : !beat ? (
          <div className="center"><p>Loading beat…</p></div>
        ) : (
          <>
            <Stage beat={beat} scenario={scenario}>
              {prompts.map((p) => {
                const responses = submissions.filter((s) => s.prompt_id === p.id);
                return (
                  <div key={p.id} className="prompt-mini">
                    <div className="prompt-mini-q">{p.question_text}</div>
                    <div className="response-feed">
                      {responses.length === 0 && <div className="muted small">No responses yet</div>}
                      {responses.map((r) => (
                        <div key={r.id} className="response-item">
                          <div className="response-text">{r.mc_choice ?? r.free_text}</div>
                          <div className="response-meta">
                            {r.participants?.display_name}
                            <span className="muted"> · {r.participants?.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Stage>
            <footer className="footer-bar">
              <button className="primary" onClick={advance}>
                {onLastBeat ? "Open Floor →" : "Next →"}
              </button>
            </footer>
          </>
        )}
      </div>

      <aside className="chat-panel">
        <div className="chat-panel-header">Comments</div>
        <ChatFeed sessionId={sessionId} authorName="Host" authorRole={null} participantId={null} />
      </aside>
    </div>
  );
}

export default function Host() {
  const { sessionId } = useParams();
  const { resolvedId, notFound } = useResolvedSessionId(sessionId);

  if (!sessionId) return <HostPicker />;
  if (notFound) return <div className="page center"><h2>Session not found</h2><p className="muted">Check the code or start a new session.</p></div>;
  if (!resolvedId) return <div className="page center"><p>Loading session…</p></div>;
  return <HostConsole sessionId={resolvedId} />;
}
