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
    const deleteZone = useMapStore(state => state.deleteZone);
    const currentMapId = useMapStore(state => state.currentMapId);
    const existingRegions = useMapStore(state => state.project?.maps[currentMapId].zones);
    const project = useMapStore(state => state.project);
    const updateMapImage = useMapStore(state => state.updateMapImage);
    const updateMap = useMapStore(state => state.updateMap);
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
                <div class="flex-col">
                    <div class="flex justify-start text-left my-5">
                        <label class="me-5">Region Name:</label>
                        <input type="text" id="regionName">
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Description:</label>
                        <textarea id="regionDesc" class="w-75"></textarea>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Region color:</label>
                        <input type="color" id="regionColor" colorspace="display-p3"/>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Region opacity:</label>
                        <input type="range" id="regionOpacity" min="0" max="100"/>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="me-5">Map Image:</label>
                    </div>
                    <input type="file" id="regionFile" accept="image/*">
                </div>
            `,
            preConfirm: () => {
                const name = (document.getElementById('regionName') as HTMLInputElement).value;
                const desc = (document.getElementById('regionDesc') as HTMLTextAreaElement).value;
                const color = (document.getElementById('regionColor') as HTMLInputElement).value;
                const opacity = (document.getElementById('regionOpacity') as HTMLInputElement).value;
                const file = (document.getElementById('regionFile') as HTMLInputElement).files?.[0];
                return { name, desc, color, opacity, file };
            },
            
        });

        if (formData) {
            await createZone(formData, currentPoints);
        }
        
        setCurrentCircles([]);
        setCurrentPoints([]);
    }

    const editZone = async(zone: Zone) => {
        const zoneMap = project.maps[zone.linkedMapId];

        const { value: formData } = await Swal.fire({
            title: "Edit region",
            html: `
                <div class="flex-col">
                    <div class="flex justify-start text-left my-5">
                        <label class="me-5">Region Name:</label>
                        <input type="text" id="regionName" value="${zoneMap.name}">
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Description:</label>
                        <textarea id="regionDesc" class="w-75">${zoneMap.description}</textarea>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Region color:</label>
                        <input type="color" id="regionColor" colorspace="display-p3" value="${zone.style.fill}"/>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="w-25 me-5">Region opacity:</label>
                        <input type="range" id="regionOpacity" min="0" max="100" value="${zone.style.opacity * 100}"/>
                    </div>
                    <div class="flex justify-start text-left my-5">
                        <label class="me-5">Map Image:</label>
                        <img src=${URL.createObjectURL(await loadImage(project.maps[zone.linkedMapId].imageKey))} class="w-[25%]"/>
                    </div>
                    <input type="file" id="regionFile" accept="image/*">
                    <button id="deleteZoneBtn" style="margin-top: 10px; padding: 8px 16px; background-color: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Delete Region
                    </button>
                </div>
            `,
            preConfirm: () => {
                const name = (document.getElementById('regionName') as HTMLInputElement).value;
                const desc = (document.getElementById('regionDesc') as HTMLTextAreaElement).value;
                const color = (document.getElementById('regionColor') as HTMLInputElement).value;
                const opacity = (document.getElementById('regionOpacity') as HTMLInputElement).value;
                const file = (document.getElementById('regionFile') as HTMLInputElement).files?.[0];
                return { name, desc, color, opacity, file };
            },
            didOpen: () => {
                const deleteBtn = document.getElementById('deleteZoneBtn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async () => {
                        deleteZone(zone.id, currentMapId);
                        await save();
                        Swal.close();
                    });
                }
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
                linkedMapId: formData.file != undefined ? mapKey : zone.linkedMapId,
                style: {
                    fill: formData.color,
                    opacity: formData.opacity / 100
                }
            }
            const updatedMap: MapData = {
                ...project.maps[zone.linkedMapId],
                name: formData.name,
                description: formData.desc
            }

            updateZone(updatedZone, zone.id, currentMapId);
            updateMap(updatedMap);

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
            description: formData.desc,
            imageKey,
            parentMapId: currentMapId,
            zones: []
        };
        const newZone: Zone = {
            id: zoneKey,
            points: currentPoints,
            linkedMapId: mapKey,
            style: {
                fill: formData.color,
                opacity: formData.opacity / 100
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
                                fill={region.style.fill}
                                opacity={region.style.opacity}
                                stroke="white"
                                strokeWidth={0.003}
                                style={{ transition: 'opacity 0.1s' }}
                                className="hover:opacity-50"
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