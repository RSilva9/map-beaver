import { create } from "zustand";
import type { MapData, MapProject } from "../types/map.types";

type MapStoreState = {
    project: MapProject | null
    currentMapId: string | null
    mode: "editor" | "viewer"
};

type MapStoreActions = {
    setCurrentMapId: (id: string) => void
    setMode: (mode: "editor" | "viewer") => void
    setProject: (project: MapProject) => void
    addMap: (map: MapData) => void
};

type MapStore = MapStoreState & MapStoreActions;

const useMapStore = create<MapStore>()((set) => ({
    project: null,
    currentMapId: null,
    mode: "viewer" as "editor" | "viewer",

    setCurrentMapId: (id) => set({ currentMapId: id }),
    setMode: (mode) => set({ mode }),
    setProject: (project) => set({ project }),
    addMap: (map) => set((state) => ({project: {
            ...state.project,
            maps: {
                ...state.project?.maps,
                [map.id]: map
            }
        }
    }))
}));

export default useMapStore;