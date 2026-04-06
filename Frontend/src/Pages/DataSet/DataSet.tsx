"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import Dataset_tabledata, { useDatasetUpload } from "@/components/layouts/DataSet_data"
import { useToast } from "@/components/ui/toast/Toast"
import { useEffect } from "react"

const Dataset = () => {
  const { show } = useToast()
  const { handleFileUpload, uploadMutation, uploadKey, resetUpload } = useDatasetUpload()

  useEffect(() => {
    if (uploadMutation.isError) {
      show({ type: "error", message: "Dataset upload failed" })
    }
    if (uploadMutation.isSuccess) {
      show({ type: "success", message: "Dataset loaded successfully" })
    }
  }, [uploadMutation.isError, uploadMutation.isSuccess])

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden" style={{ backgroundImage: 'radial-gradient(circle farthest-corner at 50% 52.5%, rgba(14,53,92,0.3) 0%, rgba(0,0,0,1) 90%)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[320px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#33E6FF]/20 to-blue-500/5 blur-3xl z-10" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1">
          <Dataset_tabledata
            handleFileUpload={handleFileUpload}
            uploadMutation={uploadMutation}
            uploadKey={uploadKey}
            resetUpload={resetUpload}
          />
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default Dataset
