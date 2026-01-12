"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import { LampDemo } from "@/components/layouts/BgLamp"
import Dataset_tabledata, { useDatasetUpload } from "@/components/layouts/DataSet_data"
import { useToast } from "@/components/ui/toast/Toast"
import { useEffect } from "react"

const Dataset = () => {
  const { show } = useToast()
  const { handleFileUpload, uploadMutation } = useDatasetUpload()

  useEffect(() => {
    if (uploadMutation.isError) {
      show({ type: "error", message: "Dataset upload failed" })
    }
    if (uploadMutation.isSuccess) {
      show({ type: "success", message: "Dataset loaded successfully" })
    }
  }, [uploadMutation.isError, uploadMutation.isSuccess])

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-950 overflow-hidden">
      <div className="absolute top-[-60px] left-0 w-full h-[360px] z-0 pointer-events-none">
        <LampDemo />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <Dataset_tabledata
          handleFileUpload={handleFileUpload}
          uploadMutation={uploadMutation}
        />

        <Footer />
      </div>
    </div>
  )
}

export default Dataset
