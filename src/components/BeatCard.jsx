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

// With an 88vh-tall hero, plain center keeps the illustration's content in frame
// on both wide desktop windows (which crop top/bottom) and narrow phones
// (which crop left/right) without needing per-scene tuning.
const SCENE_POSITION = {
  scene_wildfire: "center",
  scene_weather: "center",
  scene_comms: "center",
  scene_hotwash: "center",
};

export default function BeatCard({ beat, scenario }) {
  const sceneKey = scenario?.scene_image;
  const image = sceneKey && SCENE_IMAGE[sceneKey];
  const overlayClass = sceneKey && OVERLAY_CLASS[sceneKey];
  const position = (sceneKey && SCENE_POSITION[sceneKey]) || "center";
  const accent = scenario ? `#${scenario.accent}` : undefined;

  return (
    <section className="beat-hero" style={{ backgroundImage: image ? `url(${image})` : undefined, backgroundPosition: position }}>
      {overlayClass && <div className={overlayClass} />}
      <div className="beat-hero-shade" />
      <div className="beat-hero-content">
        {scenario && <div className="scenario-title" style={{ color: accent }}>{scenario.title}</div>}
        <div className="beat-label" style={{ color: accent }}>{beat.type.toUpperCase()} {beat.time_label && `· ${beat.time_label}`}</div>
        <p className="beat-body">{beat.body_text}</p>
      </div>
    </section>
  );
}
