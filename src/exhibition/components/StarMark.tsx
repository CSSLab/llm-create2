interface StarMarkProps {
  className?: string;
}

export default function StarMark({ className = "" }: StarMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 92 106"
      fill="currentColor"
    >
      <path d="M46 0 56.122 35.468 91.899 26.5 66.244 53l25.655 26.5-35.777-8.968L46 106 35.878 70.532.101 79.5 25.756 53 .101 26.5l35.777 8.968L46 0Z" />
    </svg>
  );
}
