import { useEffect, useRef, useState } from "react";
import { useChatMessages, sendChatMessage } from "../lib/hooks";

export default function ChatFeed({ sessionId, authorName, authorRole, participantId }) {
  const messages = useChatMessages(sessionId);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await sendChatMessage(sessionId, { participantId, authorName, authorRole, bodyText: text });
    setText("");
  }

  return (
    <div className="chat-feed-wrap">
      <div className="chat-feed" ref={listRef}>
        {messages.length === 0 && <div className="muted small chat-empty">No comments yet</div>}
        {messages.map((m) => (
          <div key={m.id} className="chat-msg">
            <div className="chat-msg-author">
              {m.author_name}{m.author_role && <span className="muted"> · {m.author_role}</span>}
            </div>
            <div className="chat-msg-text">{m.body_text}</div>
          </div>
        ))}
      </div>
      <form className="chat-input-row" onSubmit={submit}>
        <input
          className="input"
          placeholder="Add a comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="chat-send" type="submit">Send</button>
      </form>
    </div>
  );
}
