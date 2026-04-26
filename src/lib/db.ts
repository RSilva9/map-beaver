import { openDB, type DBSchema } from "idb";
import type { MapProject } from "../types/map.types";

interface MapDB extends DBSchema {
    project: {
        key: string
        value: MapProject
    }
    images: {
        key: string
        value: Blob
    }
}

const DB_NAME = "map-beaver";
const DB_VERSION = 1;

export const db = await openDB<MapDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
        db.createObjectStore("project")
        db.createObjectStore("images")
    }
})

export async function saveProject(project: MapProject): Promise<void> {
    await db.put('project', project, 'main')
}

export async function loadProject(): Promise<MapProject | undefined> {
    return db.get('project', 'main')
}

export async function saveImage(key: string, blob: Blob): Promise<void> {
    await db.put('images', blob, key)
}

export async function loadImage(key: string): Promise<Blob | undefined> {
    return db.get('images', key)
}