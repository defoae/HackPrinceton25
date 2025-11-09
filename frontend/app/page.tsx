"use client";

import { useState, useEffect } from "react";
import ScrollingVideos from "@/components/scrollingVideos";
import UploadFile from "@/components/uploadFile";
import { TypographyH1 } from "@/components/title";
import Loading from "@/components/loading";
import ResultScreen from "@/components/results";

interface ResultsData {
  confidence: number;
  is_ai_generated: boolean;
  n_frames: number;
  message: string;
}

export default function Home() {
  const [stage, setStage] = useState<"upload" | "loading" | "result">("upload");
  const [results, setResults] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch results when we enter loading stage
  useEffect(() => {
    if (stage === "loading") {
      const fetchResults = async () => {
        let attempts = 0;
        const maxAttempts = 30; // Try for up to 30 seconds
        const pollInterval = 1000; // Poll every second

        const poll = async (): Promise<void> => {
          try {
            const response = await fetch("http://127.0.0.1:5000/api/results");
            if (response.ok) {
              const data = await response.json();
              setResults(data);
              setStage("result");
              return;
            } else if (response.status === 500) {
              // If processing not ready yet, keep polling
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(poll, pollInterval);
              } else {
                setError("Processing took too long. Please try again.");
                setStage("upload");
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              setError(errorData.error || "Failed to fetch results");
              setStage("upload");
            }
          } catch (err) {
            console.error("Error fetching results:", err);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, pollInterval);
            } else {
              setError("Failed to connect to backend");
              setStage("upload");
            }
          }
        };

        // Start polling after a short delay
        setTimeout(poll, 1000);
      };

      fetchResults();
    }
  }, [stage]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ScrollingVideos />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {stage !== "result" && <TypographyH1>SlopGuard</TypographyH1>}

        {stage === "upload" && (
          <UploadFile
            onUploadStart={() => {
              setError(null);
              setResults(null);
              setStage("loading");
            }}
            onUploadComplete={() => {
              // Results will be fetched in useEffect when stage is "loading"
            }}
          />
        )}

        {stage === "loading" && <Loading />}
        {stage === "result" && results && (
          <ResultScreen 
            results={results} 
            onReset={() => {
              setResults(null);
              setError(null);
              setStage("upload");
            }}
          />
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
