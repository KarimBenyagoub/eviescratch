/** Mascot intro animation: Evie looks down at the journal she scratches before filing it away into a notes shelf (3.5s). */
export function IntroScene({ playing }: { playing: boolean }) {
  return (
    <div className="intro-splash" data-playing={playing} aria-label="Evie scratches a Journal and files it into a notes shelf">
      <div className="scratch-scene" role="img" aria-label="Evie gives a Journal a playful scratch, then puts it away on the notes shelf">
        <img
          className="intro-anim-media"
          src="/images/evie-intro.webp"
          width="360"
          height="360"
          alt="Evie scratches the journal and files it into a notes shelf"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
