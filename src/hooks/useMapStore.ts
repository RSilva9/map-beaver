import { create } from "zustand";
import type { MapData, MapProject, Zone } from "../types/map.types";
import { saveProject } from "../lib/db";

type MapStoreState = {
    project: MapProject | null
    currentMapId: string | null
    mode: "editor" | "viewer"
};

type MapStoreActions = {
    setCurrentMapId: (id: string) => void
    setMode: (mode: "editor" | "viewer") => void
    setProject: (project: MapProject) => void
    save: () => Promise<void>
    addMap: (map: MapData) => void
    addZone: (zone: Zone, mapId: string) => void
    updateZone: (zone: Zone, zoneId: string, mapId: string) => void
};

type MapStore = MapStoreState & MapStoreActions;

const useMapStore = create<MapStore>()((set, get) => ({
    project: null,
    currentMapId: null,
    mode: "viewer" as "editor" | "viewer",

    setCurrentMapId: (id) => set({ currentMapId: id }),
    setMode: (mode) => set({ mode }),
    setProject: (project) => set({ project }),
    save: async () => {
        const project = get().project
        if(project) await saveProject(project);
    },
    addMap: (map) => set((state) => ({project: {
            ...state.project,
            maps: {
                ...state.project?.maps,
                [map.id]: map
            }
        }
    })),
    addZone: (zone, mapId) => set((state) => ({project: {
        ...state.project,
        maps: {
            ...state.project?.maps,
            [mapId]: {
                ...state.project?.maps[mapId],
                zones: [...state.project?.maps[mapId].zones, zone]
            }
        }
    }})),
    updateZone: (zone, zoneId, mapId) => set((state) => ({project: {
        ...state.project,
        maps: {
            ...state.project?.maps,
            [mapId]: {
                ...state.project?.maps?.[mapId],
                zones: state.project?.maps?.[mapId]?.zones.map((existingZone) =>
                    existingZone.id === zoneId ? { ...existingZone, ...zone } : existingZone
                ) ?? []
            }
        }
    }}))
}));

export default useMapStore;