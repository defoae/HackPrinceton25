import ScrollingVideos from "@/components/scrollingVideos";
import UploadFile from "@/components/uploadFile";
import { TypographyH1 } from "@/components/title";
import Loading from "@/components/loading";

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* ScrollingVideos as the background */}
      <div className="absolute inset-0 z-0">
        <ScrollingVideos />
      </div>

      {/* Content (title and upload) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <TypographyH1>SlopGuard</TypographyH1>
        <UploadFile />
      </div>
    </div>
    // < Loading />

    <>
    < ScrollingVideos />
    < UploadFile />
    </>
  );
}