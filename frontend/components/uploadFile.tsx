"use client";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/shadcn-io/dropzone";

export default function UploadFile({
  onUploadStart,
  onUploadComplete,
}: {
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}) {
  const handleDrop = async (acceptedFiles: File[]) => {
    console.log("Successfully dropped files:", acceptedFiles);

    const file = acceptedFiles[0];
    if (!file) {
      console.error("No file found in the dropped files.");
      alert("No file found. Please try again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 🔹 Tell parent we started uploading
      onUploadStart?.();

      const processRequest = await fetch("http://127.0.0.1:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (processRequest.ok) {
        const processRequestJsonData = await processRequest.json();
        console.log("Upload successful:", processRequestJsonData);

        // 🔹 Tell parent upload finished (will transition to loading, then results)
        onUploadComplete?.();
      } else {
        const errorData = await processRequest.json().catch(() => ({}));
        console.error("Upload failed:", errorData);
        alert(errorData.error || "Failed to upload. Please try again.");
      }
    } catch (error) {
      console.error("Error posting to API endpoint:", error);
      alert("Upload error. Please check your backend.");
    }
  };

  return (
    <div className="mt-8 rounded-lg flex flex-col items-center justify-center max-w-md bg-white shadow-lg">
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