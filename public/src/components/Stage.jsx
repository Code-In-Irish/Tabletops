const SCENE_IMAGE = {
  scene_wildfire: "./scenes/scene_wildfire.png",
  scene_weather: "./scenes/scene_weather.png",
  scene_comms: "./scenes/scene_comms.png",
  scene_hotwash: "./scenes/scene_hotwash.png",
};

const OVERLAY_CLASS = {
  scene_wildfire: "flame-overlay",
  scene_weather: "rain-overlay",
  scene_comms: "signal-overlay",
};

// Stage is the full remaining viewport area (header and footer are siblings,
// not part of this component) — the scene image is a true background here,
// not a separate banner block, so nothing pushes the prompts off screen.
export default function Stage({ beat, scenario, children }) {
  const sceneKey = scenario?.scene_image;
  const image = sceneKey && SCENE_IMAGE[sceneKey];
  const overlayClass = sceneKey && OVERLAY_CLASS[sceneKey];
  const accent = scenario ? `#${scenario.accent}` : undefined;

  return (
    <div className="stage" style={{ backgroundImage: image ? `url(${image})` : undefined }}>
      {overlayClass && <div className={overlayClass} />}
      <div className="stage-shade" />
      <div className="stage-content">
        {beat && (
          <div className="stage-text">
            {scenario && <div className="scenario-title" style={{ color: accent }}>{scenario.title}</div>}
            <div className="beat-label" style={{ color: accent }}>{beat.type.toUpperCase()} {beat.time_label && `· ${beat.time_label}`}</div>
            <p className="beat-body">{beat.body_text}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
