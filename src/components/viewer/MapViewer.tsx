import useMapStore from "../../hooks/useMapStore";
import ZoneDrawer from "../editor/ZoneDrawer";
import ZoneOverlay from "./ZoneOverlay";
import { MapImage } from "../../hooks/useImageUrl";

export default function MapViewer(){
    const project = useMapStore(state => state.project);
    const currentMapId = useMapStore(state => state.currentMapId);
    const imageKey = project != null ? project.maps[currentMapId].imageKey : null;
    const mode = useMapStore(state => state.mode);
    const setMode = useMapStore(state => state.setMode);

    return(
        <div className="relative inline-block select-none">
            <button onClick={
                ()=>{
                    mode === "viewer" ? setMode("editor") : setMode("viewer");
                }
            }>CAMBIAR MODO</button>
            {mode === "editor"
                ? <ZoneDrawer><MapImage imageKey={imageKey} /></ZoneDrawer>
                : <ZoneOverlay><MapImage imageKey={imageKey} /></ZoneOverlay>
            }
        </div>
    )
}