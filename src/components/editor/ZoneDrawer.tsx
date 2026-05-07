import { useEffect, useRef, useState, type ReactNode } from "react"
import Swal from "sweetalert2";
import useMapStore from "../../hooks/useMapStore";
import { loadImage, saveImage } from "../../lib/db";
import type { MapData, Zone } from "../../types/map.types";

interface ZoneDrawerProps {
    children?: ReactNode;
}

export default function ZoneDrawer({ children }: ZoneDrawerProps) {
    type coordinates = [number, number][];
    type circles = [number, number][];

    const addMap = useMapStore(state => state.addMap);
    const addZone = useMapStore(state => state.addZone);
    const updateZone = useMapStore(state => state.updateZone);
    const currentMapId = useMapStore(state => state.currentMapId);
    const existingRegions = useMapStore(state => state.project?.maps[currentMapId].zones);
    const project = useMapStore(state => state.project);
    const updateMapImage = useMapStore(state => state.updateMapImage);
    const save = useMapStore(state => state.save);

    const svgRef = useRef<SVGSVGElement>(null);
    const [currentPoints, setCurrentPoints] = useState<coordinates>([]);
    const [currentCircles, setCurrentCircles] = useState<circles>([]);
    const [regions, setRegions] = useState<Zone[]>(existingRegions);
    const [draggedCircle, setDraggedCircle] = useState<{zoneIndex: number, circleIndex: number} | null>(null);

    useEffect(() => {
        if (existingRegions) {
            setRegions(existingRegions);
        }
    }, [existingRegions]);

    const addPolyLine = (x, y) => {
        setCurrentPoints(prev => [...prev, [x, y]])
        setCurrentCircles(prev => [...prev, [x, y]]);
    }

    const captureCoordinates = (e): [number, number] => {
        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        return [x, y]
    }

    const drawPoint = (e) => {
        const [x, y] = captureCoordinates(e);
        addPolyLine(x, y);
    }

    const updateCirclePosition = (e) => {
        const [x, y] = captureCoordinates(e);

        if(draggedCircle){
            setRegions(prev => prev.map((zone, i) => {
                if(i !== draggedCircle.zoneIndex) return zone
                return {
                    ...zone,
                    points: zone.points.map((point, j) => {
                        if(j !== draggedCircle.circleIndex) return point
                        return [x, y]
                    })
                }
            }))
        }
    }

    const endDrawing = async() => {
        const { value: formData } = await Swal.fire({
            title: "Create new region",
            html: `
                <div class="text-left">
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
        }
        
        setCurrentCircles([]);
        setCurrentPoints([]);
    }

    const editZone = async(zone: Zone) => {
        console.log(zone)
        const { value: formData } = await Swal.fire({
            title: "Edit region",
            html: `
                <div class="flex-col">
                    <div class="flex justify-start text-left my-5">
                        <label class="me-5">Region Name:</label>
                        <input type="text" id="regionName" value="${zone.label}">
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Description:</label>
                        <textarea id="regionDesc" class="w-75">${zone.description}</textarea>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="me-5">Map Image:</label>
                        <img src=${URL.createObjectURL(await loadImage(project.maps[zone.linkedMapId].imageKey))} class="w-[25%]"/>
                    </div>
                    <input type="file" id="regionFile" accept="image/*">
                </div>
            `,
            preConfirm: () => {
                const name = (document.getElementById('regionName') as HTMLInputElement).value;
                const desc = (document.getElementById('regionDesc') as HTMLTextAreaElement).value;
                const file = (document.getElementById('regionFile') as HTMLInputElement).files?.[0];
                return { name, desc, file };
            },
        });

        if(formData){
            var mapKey: string;
            if(formData.file){
                const now = Date.now();
                mapKey = `map_${now}`
                const imageKey = `img_${now}`

                updateMapImage(imageKey, mapKey, zone.linkedMapId);
                saveImage(imageKey, formData.file);
            }
            const updatedZone: Zone = {
                ...zone,
                label: formData.name,
                description: formData.desc,
                linkedMapId: formData.file != undefined ? mapKey : zone.linkedMapId
            }

            updateZone(updatedZone, zone.id, currentMapId);

            await save();
        }
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
            description: formData.desc,
            points: currentPoints,
            linkedMapId: mapKey,
            style: {
                fill: "white",
                opacity: 100
            }
        }

        setRegions(prev => [...prev, newZone]);
        
        addMap(newMap);
        addZone(newZone, currentMapId);
        await save();
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
                onMouseMove={(e) => updateCirclePosition(e)}
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
                                onContextMenu={e =>{
                                    e.preventDefault();
                                    editZone(region);
                                }}
                            />
                            {
                                region.points.map((circ, j) => (
                                    <circle
                                        key={j}
                                        cx={circ[0]}
                                        cy={circ[1]}
                                        r={0.01}
                                        className="opacity-35 hover:opacity-100 cursor-grab active:cursor-grabbing"
                                        onMouseDown={() => setDraggedCircle({zoneIndex: i, circleIndex: j})}
                                        onMouseUp={async() => {
                                            setDraggedCircle(null)
                                            const updatedZone: Zone = {
                                                ...region,
                                                points: region.points
                                            }

                                            updateZone(updatedZone, region.id, currentMapId);
                                            await save();
                                        }}
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
                            onClick={k === 0 ? (e) => { e.stopPropagation(); endDrawing() } : undefined}
                        />
                    ))
                }
            </svg>
        </div>
    )
}