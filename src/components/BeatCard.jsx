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

export default function BeatCard({ beat, scenario }) {
  const sceneKey = scenario?.scene_image;
  const image = sceneKey && SCENE_IMAGE[sceneKey];
  const overlayClass = sceneKey && OVERLAY_CLASS[sceneKey];
  const accent = scenario ? `#${scenario.accent}` : undefined;

  return (
    <section className="beat-card" style={{ borderColor: accent }}>
      {image && (
        <div className="beat-scene" style={{ backgroundImage: `url(${image})` }}>
          {overlayClass && <div className={overlayClass} />}
          <div className="beat-scene-shade" />
        </div>
      )}
      <div className="beat-card-content">
        {scenario && <div className="scenario-title" style={{ color: accent }}>{scenario.title}</div>}
        <div className="beat-label">{beat.type.toUpperCase()} {beat.time_label && `· ${beat.time_label}`}</div>
        <p className="beat-body">{beat.body_text}</p>
      </div>
    </section>
  );
}
