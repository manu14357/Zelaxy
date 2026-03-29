'use client'

export interface LoadingAgentProps {
  /**
   * Size of the loading agent
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingAgent({ size = 'md' }: LoadingAgentProps) {
  const pathLength = 150

  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
  }

  const { width, height } = sizes[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Antenna tip circle - starts at top */}
      <circle
        cx='50'
        cy='15'
        r='4'
        stroke='#F97316'
        strokeWidth='5'
        fill='none'
        style={{
          strokeDasharray: 25,
          strokeDashoffset: 25,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0s',
        }}
      />

      {/* Central antenna - flows down from tip */}
      <path
        d='M50 15 L50 40'
        stroke='#F97316'
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
        style={{
          strokeDasharray: 25,
          strokeDashoffset: 25,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0s',
        }}
      />

      {/* Left V-shape peak - starts from antenna center */}
      <path
        d='M50 40 L35 20'
        stroke='#F97316'
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        style={{
          strokeDasharray: 25,
          strokeDashoffset: 25,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0.2s',
        }}
      />

      {/* Right V-shape peak - starts from antenna center simultaneously */}
      <path
        d='M50 40 L65 20'
        stroke='#F97316'
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        style={{
          strokeDasharray: 25,
          strokeDashoffset: 25,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0.2s',
        }}
      />

      {/* Left side flow - continues from left peak down */}
      <path
        d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
        stroke='#F97316'
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        style={{
          strokeDasharray: 120,
          strokeDashoffset: 120,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0.4s',
        }}
      />

      {/* Right side flow - continues from right peak down */}
      <path
        d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
        stroke='#F97316'
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        style={{
          strokeDasharray: 120,
          strokeDashoffset: 120,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0.4s',
        }}
      />

      {/* Left eye - appears with the flow */}
      <circle
        cx='40'
        cy='55'
        r='4'
        fill='#F97316'
        style={{
          opacity: 0,
          animation: 'fadeInTopToBottom 4s linear infinite',
          animationDelay: '0s',
        }}
      />

      {/* Right eye - appears with the flow */}
      <circle
        cx='60'
        cy='55'
        r='4'
        fill='#F97316'
        style={{
          opacity: 0,
          animation: 'fadeInTopToBottom 4s linear infinite',
          animationDelay: '0s',
        }}
      />

      {/* Smile - appears with the flow */}
      <path
        d='M40 68 Q50 76 60 68'
        stroke='#F97316'
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        style={{
          strokeDasharray: 30,
          strokeDashoffset: 30,
          animation: 'drawTopToBottom 4s linear infinite',
          animationDelay: '0s',
        }}
      />

      <style>
        {`
          @keyframes drawTopToBottom {
            0% {
              stroke-dashoffset: var(--dash-length, 100);
            }
            25% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          
          @keyframes waveFromSides {
            0% {
              stroke-dashoffset: 120;
            }
            30% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          
          @keyframes waveFromCenter {
            0% {
              stroke-dashoffset: 25;
            }
            20% {
              stroke-dashoffset: 25;
            }
            40% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          
          @keyframes fadeInTopToBottom {
            0% {
              opacity: 0;
            }
            25% {
              opacity: 1;
            }
            100% {
              opacity: 1;
            }
          }
        `}
      </style>
    </svg>
  )
}
