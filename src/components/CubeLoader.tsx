import type { CSSProperties } from "react"

type CubeLoaderProps = {
  size?: number
  className?: string
}

export function CubeLoader({ size = 75, className }: CubeLoaderProps) {
  return (
    <div className={className} aria-hidden="true">
      <div className="cube-loader" style={{ "--cube-size": `${size}px` } as CSSProperties}>
        <div className="cube-top" />
        <div className="cube-wrapper">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} style={{ "--i": index } as CSSProperties} className="cube-span" />
          ))}
        </div>
      </div>
    </div>
  )
}