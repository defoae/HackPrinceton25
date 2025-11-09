"use client";

import { useState } from "react";
import ScrollingVideos from "@/components/scrollingVideos";
import UploadFile from "@/components/uploadFile";
import { TypographyH1 } from "@/components/title";
import Loading from "@/components/loading";
import ResultScreen from "@/components/results"; // create this component if you don’t have one yet

export default function Home() {
  const [stage, setStage] = useState<"upload" | "loading" | "result">("upload");

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ScrollingVideos />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <TypographyH1>SlopGuard</TypographyH1>

        {stage === "upload" && (
          <UploadFile
            onUploadStart={() => setStage("loading")}
            onUploadComplete={() => setStage("result")}
          />
        )}

        {stage === "loading" && <Loading />}
        {stage === "result" && <ResultScreen />}
      </div>
    </div>
  );
}
