type PictureProps = {
  src: string
  webp?: string
  alt: string
  className?: string
  priority?: boolean
}

export function Picture({ src, webp, alt, className, priority }: PictureProps) {
  return (
    <picture className="contents">
      {webp ? <source type="image/webp" srcSet={webp} /> : null}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : {})}
      />
    </picture>
  )
}
