import { useEffect, useRef, useState, type ReactNode } from "react"
import Swal from "sweetalert2";
import useMapStore from "../../hooks/useMapStore";
import { saveImage, saveProject } from "../../lib/db";
import type { MapData, MapProject, Zone } from "../../types/map.types";

interface ZoneDrawerProps {
    children?: ReactNode;
}

export default function ZoneDrawer({ children }: ZoneDrawerProps) {
    // ALIASES
    type coordinates = [number, number][];
    type circles = [number, number][];
    type mapRegion = [coordinates, circles][];
    // ...

    const svgRef = useRef<SVGSVGElement>(null);
    const [currentPoints, setCurrentPoints] = useState<coordinates>([]);
    const [currentCircles, setCurrentCircles] = useState<circles>([]);
    const [regions, setRegions] = useState<mapRegion>([]);

    // HOOKS
    const addMap = useMapStore(state => state.addMap);
    const addZone = useMapStore(state => state.addZone);
    const currentMapId = useMapStore(state => state.currentMapId);
    const project = useMapStore(state => state.project);
    // ...

    const addPolyLine = (x, y) => {
        setCurrentPoints(prev => [...prev, [x, y]])
        setCurrentCircles(prev => [...prev, [x, y]]);
    }

    const drawPoint = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        addPolyLine(x, y);
    }

    const endRegion = async() => {
        const { value: formData } = await Swal.fire({
            title: "Create new region",
            html: `
                <div style="text-align: left;">
                    <label>Region Name:</label>
                    <input type="text" id="regionName" class="swal2-input" placeholder="Enter region name">
                    <label>Description:</label>
                    <input type="text" id="regionDesc" class="swal2-input" placeholder="Enter description">
                    <label>Map Image:</label>
                    <input type="file" id="regionFile" class="swal2-input" accept="image/*">
                </div>
            `,
            preConfirm: () => {
                const name = (document.getElementById('regionName') as HTMLInputElement).value;
                const desc = (document.getElementById('regionDesc') as HTMLInputElement).value;
                const file = (document.getElementById('regionFile') as HTMLInputElement).files?.[0];
                return { name, desc, file };
            },
            
        });

        if (formData) {
            await createZone(formData, currentPoints);
            setRegions(prev => [...prev, [currentPoints, currentCircles]]);
        }
        
        setCurrentCircles([]);
        setCurrentPoints([]);
    }

    const createZone = async(formData: any, currentPoints: coordinates) =>{
        const mapKey = `map_${Date.now()}`;
        const zoneKey = `zone_${Date.now()}`;
        const imageKey = `img_${Date.now()}`;

        await saveImage(imageKey, formData.file);
        const newMap: MapData = {
            id: mapKey,
            name: formData.name,
            imageKey,
            parentMapId: currentMapId,
            zones: []
        };
        const newZone: Zone = {
            id: zoneKey,
            label: formData.name,
            points: currentPoints,
            linkedMapId: mapKey,
            style: {
                fill: "white",
                opacity: 100
            }
        }
        const updatedProject: MapProject = {
            ...project,
            maps: {
                ...project?.maps,
                [currentMapId]: {
                    ...project?.maps[currentMapId],
                    zones: [...project?.maps[currentMapId].zones, newZone]
                },
                [newMap.id]: newMap,
            }
        }

        addMap(newMap);
        addZone(newZone, currentMapId);
        await saveProject(updatedProject);
    }

    return(
        <div className="relative w-full h-full">
            {children}
            <svg
                className="absolute top-0 left-0 w-full h-full select-none"
                ref={svgRef}
                onClick={(e) => { if(e.detail === 1) drawPoint(e) }}
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
            >
                {
                    regions.map((region, i) => (
                        <>
                            <polygon
                                key={i}
                                points={region[0].map(([x, y]) => `${x},${y}`).join(' ')}
                                fill="#ffffff34"
                                stroke="white"
                                strokeWidth={0.003}
                                className="opacity-35 hover:opacity-100"
                            />
                            {
                                region[1].map((circ, j) => (
                                    <circle
                                        key={j}
                                        cx={circ[0]}
                                        cy={circ[1]}
                                        r={0.005}
                                        className="opacity-35 hover:opacity-100 cursor-pointer"
                                        onClick={j === 0 ? (e) => { e.stopPropagation(); endRegion() } : undefined}
                                    />
                                ))
                            }
                        </>
                    ))
                }
                {
                    currentPoints.length > 1 && (
                        <polyline
                            points={currentPoints.map(([x, y]) => `${x},${y}`).join(' ')}
                            fill="none"
                            stroke="white"
                            strokeWidth={0.003}
                            className="opacity-35 hover:opacity-100"
                        />
                    )
                }
                {
                    currentCircles.map((vertCirc, k) => (
                        <circle
                            key={k}
                            cx={vertCirc[0]}
                            cy={vertCirc[1]}
                            r={0.005}
                            cursor={"pointer"}
                            onClick={k === 0 ? (e) => { e.stopPropagation(); endRegion() } : undefined}
                        />
                    ))
                }
            </svg>
        </div>
    )
}