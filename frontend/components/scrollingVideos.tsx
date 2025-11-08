"use client";

import { useState, useEffect } from "react";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";

const VIDEO_URLS = [
    "/SORA_BOBROSS.mp4",
    "/SORA_DUDEFALLING.mp4",
    "/SORA_PURPLETHING.mp4",
    "/SORA_SQUIRREL.mp4",
    "/SORA_MONKEYCOASTER.mp4"
];

export default function ScrollingVideos() {

    // const [gridCols, setGridCols] = useState(1);
    const gridCols = 6;
    const gridRows = 3;

    const [gridItemDim, setGridItemDim] = useState({ width: 300, height: 533 });

    useEffect(() => {
        const updateGridItemDim = () => {
            const containerWidth = window.innerWidth;
            const containerHeight = window.innerHeight;

            const itemWidth = containerWidth / 6;
            const itemHeight = itemWidth * (16 / 9); 
            
            setGridItemDim({ width: itemWidth, height: itemHeight });
        };

        updateGridItemDim();
        window.addEventListener("resize", updateGridItemDim);
        return () => window.removeEventListener("resize", updateGridItemDim);
    }   , []);

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div
            className="grid"
            style={{
            gridTemplateColumns: `repeat(${gridCols}, ${gridItemDim.width}px)`, // 6 items per row
            gridTemplateRows: `repeat(${gridRows}, ${gridItemDim.height}px)`, // 4 rows
            gap: "2rem", // Add spacing between items
            width: "100%", // Full width
            height: "100%", // Full height
            backgroundColor: "black",
            }}
            >
            {Array.from({ length: gridCols * gridRows }).map((_, index) => (
                <div //Creating 1 specific grid item
                key={index}
                className="relative overflow-hidden rounded-lg"
                style={{
                    filter: "blur(10px)"
                }}
                >
                <AspectRatio ratio={9 / 16} className="w-full h-full">
                    <video
                    src={VIDEO_URLS[index % VIDEO_URLS.length]}
                    autoPlay
                    loop
                    muted
                    className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
                    
                    />
                </AspectRatio>
                </div>
            ))}
            </div>
        </div>
    );
}