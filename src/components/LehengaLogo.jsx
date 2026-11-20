// App mark: a lehenga (choli + flared skirt + dupatta). Same drawing as the app icons.
export default function LehengaLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Anokhi Fabrics">
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#561246" />
          <stop offset="1" stopColor="#b02868" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#lg-bg)" />
      <polygon points="57,17 63,17 78,70 70,72" fill="#f6c86a" />
      <polygon points="41,38 59,38 82,84 18,84" fill="#fff6ec" />
      <path d="M18 84 Q50 94 82 84 Z" fill="#fff6ec" />
      <polygon points="24.5,70 75.5,70 82,84 18,84" fill="#f6c86a" />
      <polygon points="27,73 73,73 77,81 23,81" fill="#b02868" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={30 + i * 6.7} cy="77.2" r="1.6" fill="#f6c86a" />
      ))}
      <polygon points="40.5,36 59.5,36 60,40 40,40" fill="#f6c86a" />
      <polygon points="40,17 46,17 50,25 54,17 60,17 58,36 42,36" fill="#fff6ec" />
      <line x1="43" y1="28" x2="57" y2="28" stroke="#f6c86a" strokeWidth="0.9" />
    </svg>
  );
}
