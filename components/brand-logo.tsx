import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return <Image className={`brand-logo ${className}`} src="/logos/scalesight%20coloured%20primary%20logo.svg" alt="ScaleSight" width={1042.57} height={264.71} unoptimized />;
}
