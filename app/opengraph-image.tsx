import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const alt = "ScaleSight Managed Beverage Intelligence. DEMO DATA - Synthetic Example.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  const artwork = await readFile(join(process.cwd(), "public/logos/scalesight coloured primary logo.svg"), "utf8");
  const logo = `data:image/svg+xml;base64,${Buffer.from(artwork.replace('<svg ', '<svg width="1042.57" height="264.71" ')).toString("base64")}`;
  // ImageResponse uses a native image element for its SVG renderer.
  return new ImageResponse(<div style={{display:"flex",flexDirection:"column",width:"100%",height:"100%",background:"#f5f7fa",color:"#192531",padding:80}}><img src={logo} alt="ScaleSight" width={400} height={101.56}/>
    <div style={{fontSize:62,marginTop:28,display:"flex"}}>Managed Beverage Intelligence</div><div style={{fontSize:28,marginTop:28,display:"flex"}}>Harbor Coast Beverages · Planning Workspace</div><div style={{fontSize:22,marginTop:28,display:"flex",color:"#2563eb"}}>DEMO DATA - Synthetic Example</div></div>,size); }
