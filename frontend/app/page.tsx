import Image from "next/image";
// import VideoGridBackground from "@/components/video-grid-background";
import ScrollingVideos from "@/components/scrollingVideos";
import UploadFile from "@/components/uploadFile";

export default function Home() {
  return (
    <>
    < ScrollingVideos />
    < UploadFile />
    </>
  );
}
