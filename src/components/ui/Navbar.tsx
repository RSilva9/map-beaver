import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="flex justify-between items-center p-1 bg-blue-500 text-white">
            <div className="font-semibold text-lg">Map Beaver</div>
            <div className="flex gap-5 px-2">
                <Link to={"/viewer"} className="text-white ">Viewer/Editor</Link>
                <Link to={"/gallery"} className="text-white">Gallery</Link>
                <Link to={"/uploader"} className="text-white">Uploader</Link>
            </div>
        </nav>
    )
}
