import { type ReactNode } from "react"
import useMapStore from "../../hooks/useMapStore";

interface ZoneDrawerProps {
    children?: ReactNode;
}

export default function ZoneOverlay({ children }: ZoneDrawerProps) {
    const currentMapId = useMapStore(state => state.currentMapId);
    const setCurrentMapId = useMapStore(state => state.setCurrentMapId);
    const currentMap = useMapStore(state => state.project?.maps[currentMapId]);
    const regions = useMapStore(state => state.project?.maps[currentMapId].zones);

    return(
        <div className="relative w-full h-full"
        onContextMenu={(e) => {
            e.preventDefault();
            if(currentMap.parentMapId) setCurrentMapId(currentMap.parentMapId);
        }}
        >
            {children}
            <svg
                className="absolute top-0 left-0 w-full h-full select-none"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
            >
                {
                    regions &&
                    regions.map((region, i) => (
                        <>
                            <polygon
                                key={i}
                                points={region.points.map(([x, y]) => `${x},${y}`).join(' ')}
                                fill="#ffffff34"
                                stroke="white"
                                strokeWidth={0.003}
                                className="opacity-35 hover:opacity-100"
                                onClick={() => setCurrentMapId(region.linkedMapId)}
                            />
                            {
                                region.points.map((circ, j) => (
                                    <circle
                                        key={j}
                                        cx={circ[0]}
                                        cy={circ[1]}
                                        r={0.01}
                                        className="opacity-35 hover:opacity-100 cursor-pointer"
                                    />
                                ))
                            }
                        </>
                    ))
                }
            </svg>
        </div>
    )
}