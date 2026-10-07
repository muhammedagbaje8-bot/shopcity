export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bag body */}
      <path d="M6 12.5C6 11.1193 7.11929 10 8.5 10H23.5C24.8807 10 26 11.1193 26 12.5V24.5C26 25.8807 24.8807 27 23.5 27H8.5C7.11929 27 6 25.8807 6 24.5V12.5Z" fill="#243A5E"/>
      {/* bag handle */}
      <path d="M12 10V8.5C12 6.567 13.567 5 15.5 5H16.5C18.433 5 20 6.567 20 8.5V10" stroke="#243A5E" strokeWidth="2" strokeLinecap="round"/>
      {/* city skyline notch cut into the bag, marigold */}
      <path d="M10 27V19L13 21.5V17L16 20V15L19 18V21.5L22 19V27H10Z" fill="#F0A202"/>
    </svg>
  );
}

export function Wordmark({ size = 20 }) {
  return (
    <span className="brand-wordmark" style={{ fontSize: size }}>
      Shop<span>City</span>
    </span>
  );
}