import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useSession, useBeat } from "../lib/hooks";
import BeatCard from "../components/BeatCard";

function JoinForm({ onJoin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    setSubmitting(true);
    onJoin(name.trim(), role.trim());
  }

  return (
    <form className="page center" onSubmit={submit}>
      <h1>Join the exercise</h1>
      <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <input className="input" placeholder="Role / department (e.g. Stage Manager)" value={role} onChange={(e) => setRole(e.target.value)} />
      <button className="primary" type="submit" disabled={submitting}>Join</button>
    </form>
  );
}

function PromptForm({ sessionId, participantId, prompt }) {
  const [mcChoice, setMcChoice] = useState(null);
  const [freeText, setFreeText] = useState("");
  const [sent, setSent] = useState(false);

  const showMc = prompt.response_mode === "mc" || prompt.response_mode === "both";
  const showFree = prompt.response_mode === "free" || prompt.response_mode === "both";

  async function submitMc(option) {
    setMcChoice(option);
    await supabase.from("submissions").insert({
      session_id: sessionId, prompt_id: prompt.id, participant_id: participantId, mc_choice: option,
    });
    setSent(true);
  }

  async function submitFree(e) {
    e.preventDefault();
    if (!freeText.trim()) return;
    await supabase.from("submissions").insert({
      session_id: sessionId, prompt_id: prompt.id, participant_id: participantId, free_text: freeText.trim(),
    });
    setFreeText("");
    setSent(true);
  }

  return (
    <section className="prompt-card">
      <div className="prompt-question">{prompt.question_text}</div>

      {showMc && (
        <div className="mc-options">
          {(prompt.mc_options || []).map((opt) => (
            <button
              key={opt}
              className={`mc-btn ${mcChoice === opt ? "selected" : ""}`}
              onClick={() => submitMc(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {showFree && (
        <form className="free-form" onSubmit={submitFree}>
          <textarea
            className="input textarea"
            placeholder="Your answer"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
          />
          <button className="secondary" type="submit">Send</button>
        </form>
      )}

      {sent && <div className="muted small sent-note">Sent</div>}
    </section>
  );
}

export default function Participant() {
  const { roomCode } = useParams();
  const [session, setSession] = useState(undefined); // undefined = loading, null = not found
  const [participant, setParticipant] = useState(null);

  useEffect(() => {
    supabase.from("sessions").select("*").eq("room_code", roomCode.toUpperCase()).single()
      .then(({ data }) => setSession(data ?? null));
  }, [roomCode]);

  useEffect(() => {
    if (!session) return;
    const saved = localStorage.getItem(`ttx_participant_${session.id}`);
    if (saved) setParticipant(JSON.parse(saved));
  }, [session]);

  const { session: liveSession } = useSession(session?.id);
  const currentBeatId = liveSession?.current_beat_id ?? session?.current_beat_id;
  const { beat, scenario, prompts } = useBeat(currentBeatId);

  async function join(name, role) {
    const { data, error } = await supabase
      .from("participants")
      .insert({ session_id: session.id, display_name: name, role })
      .select().single();
    if (!error) {
      localStorage.setItem(`ttx_participant_${session.id}`, JSON.stringify(data));
      setParticipant(data);
    }
  }

  if (session === undefined) return <div className="page center"><p>Loading…</p></div>;
  if (session === null) return <div className="page center"><h2>Room not found</h2></div>;
  if (!participant) return <JoinForm onJoin={join} />;
  if (liveSession?.status === "ended") return <div className="page center"><h2>Session has ended</h2></div>;
  if (!beat) return <div className="page center"><p>Waiting for the host to start…</p></div>;

  return (
    <div className="page participant">
      <div className="you-are">
        {participant.display_name} <span className="muted">· {participant.role}</span>
      </div>

      <BeatCard beat={beat} scenario={scenario} />

      {prompts.map((p) => (
        <PromptForm key={p.id} sessionId={session.id} participantId={participant.id} prompt={p} />
      ))}
    </div>
  );
}
