import { useEffect } from "react";
import MapViewer from "./components/viewer/MapViewer";
import useMapStore from "./hooks/useMapStore";
import { loadProject } from "./lib/db";
import MapUploader from "./components/editor/MapUploader";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MapGallery from "./components/viewer/MapGallery";
import Navbar from "./components/ui/Navbar";

function App(){
  const setProject = useMapStore(state => state.setProject);
  const setCurrentMapId = useMapStore(state => state.setCurrentMapId);

  useEffect(() => {
    async function init() {
      const project = await loadProject()
      if (project) {
        setProject(project);
        setCurrentMapId(project.rootMapId);
      }
    }
    
    init();
  }, [])

  return (
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/" element={
          <>
            <h1 className="text-[100px]">HELLO!</h1>
          </>
        } />
        <Route path="/viewer" element={
          <>
            <h1 className="text-[100px]">MAP VIEWER!</h1>
            <MapViewer />
          </>
        } />
        <Route path="/uploader" element={
          <>
            <h1 className="text-[100px]">MAP UPLOADER!</h1>
            <MapUploader />
          </>
        }/>
        <Route path="/gallery" element={
          <>
            <h1 className="text-[100px]">MAP GALLERY!</h1>
              <MapGallery />
          </>
        }/>
      </Routes>    
    </BrowserRouter>
  )
}

export default App;