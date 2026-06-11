interface ProgressMiniProps {
  percent: number;
}

export function ProgressMini({ percent }: ProgressMiniProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <span
      style={{
        display: 'inline-block',
        width: 78,
        height: 6,
        borderRadius: 999,
        background: 'var(--hy-track)',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-hidden
    >
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${clamped}%`,
          background: '#62b3a8',
          borderRadius: 999,
          transition: 'width .25s ease',
        }}
      />
    </span>
  );
}
