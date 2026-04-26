import { useEffect, useRef, useState } from "react"

export default function ZoneDrawer() {
    type coordinates = [number, number][];
    type circles = [number, number][];
    type mapRegion = [coordinates, circles][];

    const svgRef = useRef<SVGSVGElement>(null);
    const [points, setPoints] = useState<coordinates>([]);
    const [regions, setRegions] = useState<mapRegion>([]);
    const [vertCircles, setVertCircles] = useState<circles>([]);
    // const [isDrawing, setIsDrawing] = useState(false);

    const addPolyLine = (x, y) => {
        setPoints(prev => [...prev, [x, y]])
        setVertCircles(prev => [...prev, [x, y]]);
    }

    const startRegion = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addPolyLine(x, y);
    }

    const endRegion = () => {
        setRegions(prev => [...prev, [points, vertCircles]]);
        setVertCircles([]);
        setPoints([]);
    }

    useEffect(()=>{
        console.log(regions);
    }, [regions])

    return(
        <>
            <svg
                className="absolute top-0 left-0 w-full h-full select-none"
                ref={svgRef}
                onClick={(e) => { if(e.detail === 1) startRegion(e) }}
            >
                {
                    regions.map((region, i) => (
                        <>
                            <polygon
                                key={i}
                                points={region[0].map(([x, y]) => `${x},${y}`).join(' ')}
                                fill="#ffffff34"
                                stroke="white"
                                strokeWidth={2}
                                className="opacity-35 hover:opacity-100"
                            />
                            {
                                region[1].map((vertCirc, j) => (
                                    <circle
                                        key={j}
                                        cx={vertCirc[0]}
                                        cy={vertCirc[1]}
                                        r={6}
                                        className="opacity-35 hover:opacity-100 cursor-pointer"
                                        onClick={j === 0 ? (e) => { e.stopPropagation(); endRegion() } : undefined}
                                    />
                                ))
                            }
                        </>
                    ))
                }
                {
                    points.length > 1 && (
                        <polyline
                            points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                            fill="none"
                            stroke="white"
                            strokeWidth={2}
                            className="opacity-35 hover:opacity-100"
                        />
                    )
                }
                {
                    vertCircles.map((vertCirc, k) => (
                        <circle
                            key={k}
                            cx={vertCirc[0]}
                            cy={vertCirc[1]}
                            r={6}
                            cursor={"pointer"}
                            onClick={k === 0 ? (e) => { e.stopPropagation(); endRegion() } : undefined}
                        />
                    ))
                }
            </svg>
        </>
    )
}