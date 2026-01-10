"use client"

import Header from "@/components/layouts/Header"
import { Footer } from "@/components/layouts/Footer"
import { LampDemo } from "@/components/layouts/BgLamp"
import Dataset_tabledata from "@/components/layouts/DataSet_data"

const Dataset = () => {
  return (
    <div className="relative flex flex-col min-h-screen bg-slate-950 overflow-hidden">

      {/* Lamp Background */}
      <div className="absolute top-[-60px] left-0 w-full h-[360px] z-0 pointer-events-none">
        <LampDemo />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <Header />

        {/* DataTable */}
        <Dataset_tabledata />

        {/* Footer */}
        <Footer />

      </div>
    </div>

  )
}


export default Dataset
