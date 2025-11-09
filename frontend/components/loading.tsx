"use client";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";

const VIDEO_URLS = [
    "/SubwaySurfers1.mp4",
]   

export default function Loading() {
  const videoSrc = VIDEO_URLS[Math.floor(Math.random() * VIDEO_URLS.length)];

  return (
    <div className="flex items-center justify-center h-screen bg-transparent">
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: "300px",
          height: "533px",
        }}
      >
        <AspectRatio ratio={9 / 16} className="w-full h-full">
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            className="h-full w-full rounded-lg object-cover"
          />
        </AspectRatio>
        
        {/* Circular loader overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="bg-white/90 rounded-full p-4 shadow-lg">
            <Spinner variant="bars" size={60} className="text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}