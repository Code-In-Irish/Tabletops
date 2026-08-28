import { useState } from "react";
import ChatFeed from "./ChatFeed";

export default function ChatBubble({ sessionId, authorName, authorRole, participantId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open comments">💬</button>
      {open && (
        <div className="chat-overlay" onClick={() => setOpen(false)}>
          <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="chat-sheet-header">
              <span>Comments</span>
              <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <ChatFeed sessionId={sessionId} authorName={authorName} authorRole={authorRole} participantId={participantId} />
          </div>
        </div>
      )}
    </>
  );
}
