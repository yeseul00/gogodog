import type { MemoryFragmentId } from '../game/types';

interface MemoryIconProps {
  id: MemoryFragmentId;
  locked?: boolean;
  size?: number;
  className?: string;
}

export function MemoryIcon({
  id,
  locked = false,
  size = 44,
  className = '',
}: MemoryIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Medallion Backing */}
      <circle
        cx="24"
        cy="24"
        r="21"
        fill={locked ? '#EFE7DB' : '#FFF7E2'}
        stroke={locked ? '#D5C6B2' : '#E7A83E'}
        strokeWidth="2.2"
      />
      <circle
        cx="24"
        cy="24"
        r="17.5"
        stroke={locked ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)'}
        strokeWidth="1.4"
        strokeDasharray="3.5 3.5"
      />

      <g opacity={locked ? 0.32 : 1} style={locked ? { filter: 'grayscale(100%)' } : undefined}>
        {id === 'pigeonFriend' && (
          <g>
            {/* Friendly pastel baby pigeon */}
            <ellipse cx="25" cy="27" rx="10" ry="7.4" transform="rotate(-6 25 27)" fill="#8FBBD1" />
            <ellipse cx="26" cy="28" rx="6.4" ry="4.4" transform="rotate(-6 26 28)" fill="#DCEFF8" />
            <circle cx="18" cy="20" r="5.8" fill="#A8D0E4" />
            <circle cx="19" cy="21.8" r="1.5" fill="#F79FB0" />
            <circle cx="16.5" cy="19.2" r="1.2" fill="#3A2C22" />
            <path d="M13 19L9.5 20.5L13 22Z" fill="#F3A544" />
            {/* Tiny heart above */}
            <path
              d="M31.5 18.8C29 16.9 28.4 14.3 30 13.4C31.1 12.8 32 13.7 32 14.3C32 13.7 32.9 12.8 34 13.4C35.6 14.3 35 16.9 32.5 18.8L32 19.2Z"
              fill="#EE6D85"
            />
          </g>
        )}

        {id === 'specialStick' && (
          <g>
            {/* Y-shaped treasure twig with green sprouts */}
            <path
              d="M13 33L34 16M23 25L20 14"
              stroke="#9C5F30"
              strokeWidth="4.6"
              strokeLinecap="round"
            />
            <path
              d="M15 31.5L32 17.5"
              stroke="#D89E64"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <ellipse cx="18" cy="13" rx="4.2" ry="2.2" transform="rotate(-28 18 13)" fill="#7DC456" />
            <ellipse cx="34.5" cy="15" rx="3.8" ry="2" transform="rotate(24 34.5 15)" fill="#8ED168" />
          </g>
        )}

        {id === 'cherryBlossom' && (
          <g transform="translate(24 24)">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-7.5"
                rx="4.6"
                ry="6.6"
                transform={`rotate(${deg})`}
                fill="#F7A3BC"
                stroke="#FFF5F8"
                strokeWidth="0.9"
              />
            ))}
            <circle cx="0" cy="0" r="3.4" fill="#F7C948" />
          </g>
        )}

        {id === 'leafVine' && (
          <g>
            {/* Crunchy autumn leaf vine */}
            <path
              d="M13 33C20 24 28 26 35 16"
              stroke="#7E5434"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <ellipse cx="17" cy="26" rx="5.6" ry="3.4" transform="rotate(-34 17 26)" fill="#E27A3F" />
            <ellipse cx="25" cy="28" rx="5.5" ry="3.3" transform="rotate(28 25 28)" fill="#F0AE42" />
            <ellipse cx="29" cy="19" rx="5.4" ry="3.3" transform="rotate(-22 29 19)" fill="#D45A38" />
            <ellipse cx="22" cy="18" rx="5" ry="3.1" transform="rotate(-50 22 18)" fill="#8BBF4E" />
          </g>
        )}

        {id === 'forestAcorn' && (
          <g transform="translate(24 24) rotate(-12)">
            <path d="M-8.5 -1Q-8.5 11 0 12.5Q8.5 11 8.5 -1Z" fill="#C47D3E" />
            <path
              d="M-10.2 -1A10.2 5.4 0 0 1 10.2 -1L10.2 0.2Q0 3.2 -10.2 0.2Z"
              fill="#6E4226"
            />
            <path d="M0 -6.5L1.6 -11.5" stroke="#58331C" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="-3.4" cy="4.8" rx="2" ry="3.2" transform="rotate(-12 -3.4 4.8)" fill="#FFF5DC" fillOpacity="0.72" />
          </g>
        )}

        {id === 'pineconeToy' && (
          <g transform="translate(24 24)">
            <path d="M0 -9L-7 -13M0 -9L7 -12" stroke="#4F8442" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="-2.6" cy="-6" rx="3.8" ry="3.2" fill="#A77246" />
            <ellipse cx="2.6" cy="-6" rx="3.8" ry="3.2" fill="#A77246" />
            <ellipse cx="-4.2" cy="-1" rx="4.8" ry="3.5" fill="#8F5B34" />
            <ellipse cx="4.2" cy="-1" rx="4.8" ry="3.5" fill="#8F5B34" />
            <ellipse cx="0" cy="0" rx="4.8" ry="3.6" fill="#9E683C" />
            <ellipse cx="-3.6" cy="4.5" rx="4.4" ry="3.4" fill="#784826" />
            <ellipse cx="3.6" cy="4.5" rx="4.4" ry="3.4" fill="#784826" />
            <ellipse cx="0" cy="5.5" rx="4.4" ry="3.4" fill="#87542F" />
            <ellipse cx="0" cy="9.8" rx="4.2" ry="3" fill="#653A1E" />
          </g>
        )}

        {id === 'puppuccino' && (
          <g transform="translate(24 24)">
            <path d="M-7.5 1L7.5 1L5.8 12.2L-5.8 12.2Z" fill="#E8C59E" />
            <rect x="-6.8" y="4.5" width="13.6" height="3.8" rx="1" fill="#C87846" />
            <circle cx="-4.5" cy="-1" r="4.8" fill="#FFFFFF" stroke="#EFE4D4" strokeWidth="0.7" />
            <circle cx="4.5" cy="-1" r="4.8" fill="#FFFFFF" stroke="#EFE4D4" strokeWidth="0.7" />
            <circle cx="0" cy="-5" r="5.4" fill="#FFFFFF" stroke="#EFE4D4" strokeWidth="0.7" />
            <rect x="-3.8" y="-10.6" width="7.6" height="3.2" rx="1.5" fill="#E8A84C" />
          </g>
        )}

        {id === 'warmBulb' && (
          <g transform="translate(24 24)">
            <rect x="-3.8" y="-11.5" width="7.6" height="4.8" rx="1.6" fill="#7A685B" />
            <circle cx="0" cy="2.5" r="9.4" fill="#FFE066" stroke="#E59B22" strokeWidth="1.2" />
            <circle cx="-2.4" cy="-0.4" r="3.2" fill="#FFFDF0" fillOpacity="0.85" />
            <path d="M-2.5 -6L-1.5 1.5L1.5 1.5L2.5 -6" stroke="#C97818" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {id === 'terraceBall' && (
          <g transform="translate(24 24)">
            <circle cx="0" cy="0" r="10.5" fill="#F5C442" stroke="#D48F1E" strokeWidth="1.2" />
            <path d="M8 -6.5A10.5 10.5 0 0 1 6.5 8.2" stroke="#4E9A84" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M-8 6.5A10.5 10.5 0 0 1 -6.5 -8.2" stroke="#4E9A84" strokeWidth="3.2" strokeLinecap="round" />
            <ellipse cx="-3.6" cy="-4.2" rx="2.8" ry="1.8" transform="rotate(-28 -3.6 -4.2)" fill="#FFFFFF" fillOpacity="0.78" />
          </g>
        )}
      </g>
    </svg>
  );
}
