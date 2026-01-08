import Header from "@/components/layouts/Header";
import { Footer } from "@/components/layouts/Footer";
import { FileUpload } from "@/components/ui/file-upload";
import { useState } from "react";
import BgAnimation from "@/components/layouts/BgAnimation";
const Dataset = () => {

  const handleFileUpload = async (files: File[]) => {
  if (!files || files.length === 0) return;

  // Always take ONLY the first file
  const file = files[0];

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  console.log("CSV INFO:", data);
};


  return (
    <div className="min-h-screen relative transition-colors bg-black">
      <BgAnimation />
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
