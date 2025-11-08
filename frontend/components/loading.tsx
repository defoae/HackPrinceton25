"use client";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Progress } from "@radix-ui/react-progress";
import { useState, useEffect } from "react";

const VIDEO_URLS = [
    "/SubwaySurfers1.mp4",
]   


export default function Loading() {
  const videoSrc = VIDEO_URLS[Math.floor(Math.random() * VIDEO_URLS.length)];

    
  return (
    <>
    {/* <div className="flex items-center justify-center h-screen bg-black">
      <Spinner variant="bars" size={100} className="text-blue-500" />
    </div> */}
    < Progress />
    <div className="flex items-center justify-center h-screen bg-black">
        <div
        className="relative overflow-hidden rounded-full spin "
        style={{
            width: "300px", // Adjust width as needed
            height: "533px", // Adjust height as needed to maintain 16:9 aspect ratio
        }}
        >
        <AspectRatio ratio={9 / 16} className="w-full h-full">
            <video
            src={videoSrc}
            autoPlay
            loop
            muted
            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
            />
        </AspectRatio>
        </div>
    </div>
    </>
  );
}