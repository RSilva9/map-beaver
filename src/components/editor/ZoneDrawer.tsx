import { useRef } from "react"

export default function ZoneDrawer() {
    const svgRef = useRef<SVGSVGElement>(null);


    return(
        <>
            <svg
                ref={svgRef}
                style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                }}
                onClick={(e) => {
                    const rect = svgRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                }}
            >
                {/* acá van los polígonos */}
            </svg>
        </>
    )
}