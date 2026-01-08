import LightRays from "@/components/ui/lightrays";
import Header from "@/components/layouts/Header";
import { Footer } from "@/components/layouts/Footer";
import { FileUpload } from "@/components/ui/file-upload";
import { useState } from "react";
const Dataset = () => {

  const [files, setFiles] = useState<File[]>([]);
  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    console.log(files);
  };

  return (
    <div className="min-h-screen relative transition-colors bg-black">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#33E6FF"
          raysSpeed={1.5}
          lightSpread={2}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
        />
      </div>
      <div className="ml-10">

        <Header />
      </div>
      <div className="mt-8 mb-40">
        <h1 className="text-4xl mb-2 text-center font-bold text-neutral-900 dark:text-white">
          Add Your Files
        </h1>
        <p className="mt-2 text-center mb-10 text-neutral-600 dark:text-neutral-400">
          Choose files and upload them below
        </p>



        <div className="w-full max-w-4xl mx-auto min-h-80 border border-dashed bg-background border-neutral-200 dark:border-neutral-800 rounded-lg">
          <FileUpload onChange={handleFileUpload} />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Dataset
