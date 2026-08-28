import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  function join(e) {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/r/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="page center">
      <h1>TTX Live</h1>
      <button className="primary" onClick={() => navigate("/host")}>Host a session</button>

      <div className="divider">or</div>

      <form className="stack" onSubmit={join}>
        <input
          className="input room-code-input"
          placeholder="ROOM CODE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          autoCapitalize="characters"
        />
        <button className="secondary" type="submit">Join</button>
      </form>
    </div>
  );
}
