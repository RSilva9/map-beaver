import { useEffect, useState } from "react";
import useMapStore from "../../hooks/useMapStore"
import { MapImage } from "../../hooks/useImageUrl";
import { Link } from "react-router-dom";

type MapNode = {
    id: string
    name: string,
    description: string,
    image: string,
    regions: MapNode[]
}

export default function MapGallery(){
    const project = useMapStore(state => state.project);
    const setCurrentMapId = useMapStore(state => state.setCurrentMapId);
    const [isNested, setIsNested] = useState<boolean>(true)
    const [root, setRoot] = useState<MapNode | null>(null);
    const [path, setPath] = useState<MapNode[]>([]);
    const columns = root
        ? [root, ...path]
        : [];

    useEffect(()=> {
        setRoot(buildMap(project?.rootMapId));
    }, [project])

    const buildMap = (mapId: string) => {
        if(project){
            const rootMap = project.maps[mapId];

            return(
                {
                    id: rootMap.id,
                    name: rootMap.name,
                    description: rootMap.description,
                    image: rootMap.imageKey,
                    regions: rootMap.zones.map(region => buildMap(region.linkedMapId))
                }
            )
        } else {
            return null
        }
    }

    const addToPath = (region: MapNode, level: number) => {
        const next = path.slice(0, level);
        next.push(region);
        setPath(next);
    }

    const removeFromPath = (level: number) => {
        const prev = path.slice(0, level - 1);
        setPath(prev);
    }

    return(
        <div className="m-5">
            <button className="customButton mb-5" onClick={() => setIsNested(!isNested)}>Switch view mode</button>
            {
                isNested ?
                <div className="flex gap-4">
                    {columns.map((node, level) => (
                        <div key={node.id} className="flex flex-col gap-2 w-[250px] border rounded p-3">
                            <div className="flex justify-between">
                                <h2 className="font-bold">{node.name}</h2>
                                {
                                    level !== 0 &&
                                    <button className="customButton w-[25px]" onClick={() => removeFromPath(level)}>
                                        X
                                    </button>
                                }
                            </div>
                            <h3>{node.description}</h3>
                            <MapImage imageKey={node.image} className="w-50"/>
                            <Link to={"/viewer"} className="customButton w-[100px]" onClick={() => setCurrentMapId(node.id)}>
                                Ir al mapa
                            </Link>
                            <hr />
                            <h2 className="font-bold">Regions</h2>
                            <div className="flex flex-col gap-2">
                                {node.regions.map(region => (
                                    <div className="border rounded p-5">
                                        <h2 className="font-semibold">{region.name}</h2>
                                        <h3>{region.description}</h3>
                                        <button key={region.id} onClick={() => addToPath(region, level)} className="customButton w-[100px]">
                                            Ver
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div> :
                <div>
                    {/* HERE GOES THE GRID VIEW */}
                </div>
            }
        </div>
    )
}