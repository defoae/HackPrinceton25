"use client";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/shadcn-io/dropzone";

export default function UploadFile() {
    const handleDrop = async (acceptedFiles: File[]) => {
        console.log("Successfully dropped files:", acceptedFiles);

        // Processing file:
        const file = acceptedFiles[0]; // This really shouldn't be an array but the component had too much built in functionality for array and i got lazy
        if (!file) {
            console.error("No file found in the dropped files.");
            alert("No file found. Please try again.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const processRequest = await fetch("http://127.0.0.1:5000/api/upload", {
                method: "POST",
                body: formData,
            });
            
            if (processRequest.ok) {
                const processRequestJsonData = await processRequest.json();
                let processUrl = processRequestJsonData["process_url"];
                console.log("Process URL:", processUrl);
                alert("File uploaded and successfully sent to Flask backend");
            }

        } catch (error) {
            console.error("Error posting to API endpoint:", error);
        }


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