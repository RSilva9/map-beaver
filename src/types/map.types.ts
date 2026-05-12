export interface Zone {
    id: string
    points: [number, number][]
    linkedMapId: string | null
    style: ZoneStyle
}

export interface ZoneStyle {
    fill: string
    opacity: number
}

export interface MapData {
    id: string
    name: string
    description: string
    imageKey: string
    parentMapId: string | null
    zones: Zone[]
}

export interface MapProject {
    maps: Record<string, MapData>
    rootMapId: string
}