"use client";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/shadcn-io/dropzone";

export default function UploadFile() {
    const handleDrop = async (acceptedFiles: File[]) => {
        console.log("Successfully dropped files:", acceptedFiles);

        // Processing file:
        // const file = acceptedFiles[0]; // This really shouldn't be an array but the component had too much built in functionality for array and i got lazy
        // const formData = new FormData();
        // formData.append("file", file);

        // try {
        //     const response = await fetch("/api/upload", {
        //         method: "POST",
        //         body: formData,
        //     });
            
        //     if (!response.ok) {
        //         throw new Error(`HTTP error! status: ${response.status}`);
        //     }

        //     const data = await response.json();
        //     console.log("Server response:", data);
        // } catch (error) {
        //     console.error("Error posting to API endpoint:", error);
        // }


    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-100">
            <div className="border-2 border-red-500 rounded-lg flex flex-col items-center justify-center max-w-md">
                <Dropzone
                    accept={{ 'video/mp4': [] }}
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024} // 5 MB
                    onDrop={handleDrop}
                >
                    <DropzoneEmptyState />
                    <DropzoneContent />
                </Dropzone>
            </div>
        </div>
    );
}