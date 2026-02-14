import LightRays from "@/components/ui/lightrays";
const BgAnimation = () => {
  return (
       <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
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
  )
}

export default BgAnimation
