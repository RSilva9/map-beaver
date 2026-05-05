import { useEffect, useState } from "react";
import useMapStore from "../../hooks/useMapStore"
import { loadImage } from "../../lib/db";
import ZoneDrawer from "../editor/ZoneDrawer";
import ZoneOverlay from "./ZoneOverlay";

export default function MapViewer(){
    const project = useMapStore(state => state.project);
    const currentMapId = useMapStore(state => state.currentMapId);
    const [imageURL, setImageURL] = useState(null);
    const imageKey = project != null ? project.maps[currentMapId].imageKey : null;
    const mode = useMapStore(state => state.mode);
    const setMode = useMapStore(state => state.setMode);

    useEffect(()=>{
        async function getMap(){
            const blob = await loadImage(imageKey);
            setImageURL(URL.createObjectURL(blob));
        }

        if(project != null){
            getMap();
        }

        return () => {
            if(imageURL) URL.revokeObjectURL(imageURL);
        }
    }, [imageKey])

    return(
        <div className="relative inline-block select-none">
            <button onClick={
                ()=>{
                    mode === "viewer" ? setMode("editor") : setMode("viewer");
                }
            }>CAMBIAR MODO</button>
            {mode === "editor"
                ? <ZoneDrawer><img src={imageURL} /></ZoneDrawer>
                : <ZoneOverlay><img src={imageURL} /></ZoneOverlay>
            }
        </div>
    )
}