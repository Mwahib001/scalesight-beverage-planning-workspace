import { ImageResponse } from "next/og";
export const alt = "ScaleSight Managed Beverage Intelligence. DEMO DATA - Synthetic Example.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() { return new ImageResponse(<div style={{display:"flex",flexDirection:"column",width:"100%",height:"100%",background:"#10233f",color:"white",padding:80}}><div style={{fontSize:56,display:"flex",color:"#e0bd75"}}>ScaleSight</div><div style={{fontSize:70,marginTop:55,display:"flex"}}>Managed Beverage Intelligence</div><div style={{fontSize:28,marginTop:45,display:"flex"}}>Harbor Coast Beverages · Planning Workspace</div><div style={{fontSize:22,marginTop:40,display:"flex",color:"#e0bd75"}}>DEMO DATA - Synthetic Example</div></div>,size); }
