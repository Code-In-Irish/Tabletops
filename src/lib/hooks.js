import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

// Tracks a session row live (host advances current_beat_id, everyone else follows).
export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    supabase.from("sessions").select("*").eq("id", sessionId).single()
      .then(({ data }) => { if (active) { setSession(data); setLoading(false); } });

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => setSession(payload.new))
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [sessionId]);

  return { session, loading };
}

// Loads a beat, its parent scenario, and its prompts. Re-fetches whenever beatId changes
// (the host advancing current_beat_id is what drives this, via useSession above).
export function useBeat(beatId) {
  const [beat, setBeat] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!beatId) { setBeat(null); setScenario(null); setPrompts([]); setLoading(false); return; }
    let active = true;
    setLoading(true);

    supabase.from("beats").select("*").eq("id", beatId).single().then(({ data: beatData }) => {
      if (!active || !beatData) return;
      setBeat(beatData);

      Promise.all([
        supabase.from("scenarios").select("*").eq("id", beatData.scenario_id).single(),
        supabase.from("prompts").select("*").eq("beat_id", beatId).order("order"),
      ]).then(([scenarioRes, promptsRes]) => {
        if (!active) return;
        setScenario(scenarioRes.data);
        setPrompts(promptsRes.data || []);
        setLoading(false);
      });
    });

    return () => { active = false; };
  }, [beatId]);

  return { beat, scenario, prompts, loading };
}

// Live submission feed for a session. Kept as a flat list; components filter by prompt_id.
export function useSubmissions(sessionId) {
  const [submissions, setSubmissions] = useState([]);

  const refresh = useCallback(() => {
    if (!sessionId) return;
    supabase
      .from("submissions")
      .select("*, participants(display_name, role)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setSubmissions(data || []));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    refresh();

    const channel = supabase
      .channel(`submissions:${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "submissions", filter: `session_id=eq.${sessionId}` },
        () => refresh())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, refresh]);

  return submissions;
}

// Live chat/comment ticker for a session. Persists for the whole session,
// independent of which beat is currently showing.
export function useChatMessages(sessionId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true })
      .then(({ data }) => { if (active) setMessages(data || []); });

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [sessionId]);

  return messages;
}

export async function sendChatMessage(sessionId, { participantId = null, authorName, authorRole = null, bodyText }) {
  if (!bodyText?.trim()) return;
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    participant_id: participantId,
    author_name: authorName,
    author_role: authorRole,
    body_text: bodyText.trim(),
  });
}

export function useParticipants(sessionId) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    supabase.from("participants").select("*").eq("session_id", sessionId).order("joined_at")
      .then(({ data }) => { if (active) setParticipants(data || []); });

    const channel = supabase
      .channel(`participants:${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants((prev) => [...prev, payload.new]))
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [sessionId]);

  return participants;
}
