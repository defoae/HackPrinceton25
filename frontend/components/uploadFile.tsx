"use client";

import { useEffect, useState } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/shadcn-io/dropzone";
import { getBlobFromStorage, deleteBlobFromStorage, getVideoIdFromUrl } from "@/lib/indexeddb";

export default function UploadFile({
  onUploadStart,
  onUploadComplete,
}: {
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}) {
  const [extensionError, setExtensionError] = useState<string | null>(null);

  // Check for videoId from Chrome Extension on mount
  useEffect(() => {
    const handleExtensionUpload = async () => {
      const videoId = getVideoIdFromUrl();
      if (!videoId) return; // No videoId, user will manually upload

      try {
        console.log('Retrieved videoId from URL:', videoId);
        
        // Notify parent that upload is starting
        onUploadStart?.();

        // Fetch the blob and metadata from IndexedDB
        const record = await getBlobFromStorage(videoId);
        console.log('Retrieved video blob:', {
          size: record.blob.size,
          type: record.blob.type,
          sourceUrl: record.sourceUrl,
          timestamp: new Date(record.timestamp).toISOString()
        });

        // Create a File object from the blob
        const file = new File(
          [record.blob],
          `instagram-video-${videoId}.mp4`,
          { type: record.blob.type || 'video/mp4' }
        );

        // Upload to backend
        await uploadToServer(file, record);

        // Clean up IndexedDB after successful upload
        await deleteBlobFromStorage(videoId);
        console.log('Upload complete! Cleaned up IndexedDB.');

        // Notify parent that upload is complete
        onUploadComplete?.();
      } catch (error) {
        console.error('Extension upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve video from extension';
        setExtensionError(errorMessage);
        // Don't call onUploadStart if we haven't yet, so user can try manual upload
      }
    };

    handleExtensionUpload();
  }, []); // Empty dependency array - only run once on mount

  const uploadToServer = async (file: File, metadata?: { sourceUrl: string; timestamp: number }) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Optionally include metadata from extension
    if (metadata) {
      formData.append("sourceUrl", metadata.sourceUrl);
      formData.append("timestamp", metadata.timestamp.toString());
    }

    const response = await fetch("http://127.0.0.1:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to upload. Please try again.");
    }

    const data = await response.json();
    console.log("Upload successful:", data);
    return data;
  };

  const handleDrop = async (acceptedFiles: File[]) => {
    console.log("Successfully dropped files:", acceptedFiles);

    const file = acceptedFiles[0];
    if (!file) {
      console.error("No file found in the dropped files.");
      alert("No file found. Please try again.");
      return;
    }

    try {
      // 🔹 Tell parent we started uploading
      onUploadStart?.();

      await uploadToServer(file);

      // 🔹 Tell parent upload finished (will transition to loading, then results)
      onUploadComplete?.();
    } catch (error) {
      console.error("Error posting to API endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload error. Please check your backend.";
      alert(errorMessage);
    }
  };

  return (
    <div className="mt-8 rounded-lg flex flex-col items-center justify-center max-w-md bg-white shadow-lg">
      {extensionError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded w-full">
          <strong>Extension Error:</strong> {extensionError}
          <p className="mt-2 text-sm">You can still upload manually below.</p>
        </div>
      )}
      <Dropzone
        accept={{ "video/mp4": [] }}
        maxFiles={1}
        maxSize={100 * 1024 * 1024} // 100 MB
        onDrop={handleDrop}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  );
}