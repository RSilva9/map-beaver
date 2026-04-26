import { useState } from "react"
import { saveImage, saveProject } from "../../lib/db";
import useMapStore from "../../hooks/useMapStore";
import type { MapData, MapProject } from "../../types/map.types";

export default function ImageUploader(){
    const [file, setFile] = useState(null);
    const [isRoot, setIsRoot] = useState(false);
    const [parentMap, setParentMap] = useState(null);
    const [mapName, setMapName] = useState("");
    const project = useMapStore(state => state.project);
    const addMap = useMapStore(state => state.addMap);
    const setCurrentMapId = useMapStore(state => state.setCurrentMapId);

    const addNewMap = async()=>{
        const mapKey = `map_${Date.now()}`;
        const imageKey = `img_${Date.now()}`;
        await saveImage(imageKey, file);
        const newMap: MapData = {
            id: mapKey,
            name: mapName,
            imageKey,
            parentMapId: parentMap,
            zones: []
        }
        const updatedProject: MapProject = {
            ...project,
            ...(isRoot && { rootMapId: newMap.id }),
            maps: {
                ...project?.maps,
                [newMap.id]: newMap
            }
        }

        addMap(newMap);
        setCurrentMapId(mapKey);
        await saveProject(updatedProject);
    }

    return(
        <>
            <div className="flex p-5">
                <h1 className="me-15">Image file:</h1>
                <input 
                    type="file" 
                    onChange={e => setFile(e.target.files[0])}
                />
            </div>
            <div className="flex p-5">
                <h1 className="me-15">Map name:</h1>
                <input 
                    type="text" 
                    onChange={e => setMapName(e.target.value)}
                />
            </div>
            <div className="flex p-5">
                <h1 className="me-15">Is it the project's root map?:</h1>
                <input 
                    type="checkbox" 
                    onChange={(e)=> setIsRoot(e.target.checked)}
                />
            </div>
            <div className="flex p-5">
                <h1 className="me-15">Parent map:</h1>
                <select onChange={(e) => {setParentMap(e.target.value)}}>
                    <option>Seleccionar</option>
                    {
                        project && project.maps &&
                        Object.values(project.maps).map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))
                    }
                </select>
            </div>
            <button onClick={addNewMap}>Confirm</button>
        </>
    )
}