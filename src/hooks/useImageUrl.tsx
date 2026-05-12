import { useEffect, useState } from "react"
import { loadImage } from "../lib/db";

const useImageUrl = (imageKey: string | null) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if(!imageKey) return;

        (async () => {
            const blob = await loadImage(imageKey);
            setImageUrl(URL.createObjectURL(blob));
            return () => URL.revokeObjectURL(imageUrl);
        })();
    }, [imageKey]);

    return imageUrl;
}

export function MapImage({ imageKey, className }: { imageKey: string; className?: string }){
    const imageUrl = useImageUrl(imageKey);
    return (<img src={imageUrl} className={className}/>);
}