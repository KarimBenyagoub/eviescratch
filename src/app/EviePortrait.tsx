import { useEffect, useState } from 'react';

/**
 * Evie companion portrait:
 * - Asleep: Gentle authentic breathing loop with subtle ear twitch (evie-sleeping.webp), 1:1 pixel proportions
 * - Awake: Continuous natural idle loop with authentic blinking, tail flicking, and 2.8s yawning (evie-awake.webp)
 */
export function EviePortrait({ awake = false, className = '' }: { awake?: boolean; className?: string }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motion.matches);
    const onChange = () => setReducedMotion(motion.matches);
    motion.addEventListener('change', onChange);
    return () => motion.removeEventListener('change', onChange);
  }, []);

  return (
    <span
      role="img"
      aria-label={awake ? 'Evie awake beside your note' : 'Evie sleeping peacefully'}
      className={`evie-portrait ${awake ? 'evie-awake' : 'evie-asleep'} ${className}`}
    >
      <img
        src={
          reducedMotion
            ? (awake ? '/images/evie.webp' : '/images/evie-intro-rest.webp')
            : (awake ? '/images/evie-awake.webp' : '/images/evie-sleeping.webp')
        }
        width="216"
        height="216"
        alt={awake ? 'Evie awake beside your note' : 'Evie sleeping peacefully'}
        draggable="false"
      />
    </span>
  );
}
