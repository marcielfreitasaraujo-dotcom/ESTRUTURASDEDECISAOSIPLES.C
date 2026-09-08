type BrandLineProps = {
  className?: string
}

export function BrandLine({ className = '' }: BrandLineProps) {
  return <hr className={`brand-line ${className}`} />
}
