import { useState } from "react"
import { Check } from "lucide-react"
import { PipelineStep } from "@/services/cleaning.service"

interface StepsStepperProps {
  steps: PipelineStep[]
}

export const StepsStepper = ({ steps }: StepsStepperProps) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  if (steps.length === 0) return null

  // Map step types to readable names and descriptions
  const getStepInfo = (step: PipelineStep) => {
    const infoMap: Record<string, { name: string; description: string }> = {
      drop_duplicates: {
        name: "Drop Duplicates",
        description: `Removed duplicate rows using ${step.strategy} strategy`,
      },
      replace_values: {
        name: "Replace Values",
        description: `Replaced values using ${step.strategy} strategy`,
      },
      missing_values: {
        name: "Missing Values",
        description: `Handled missing data using ${step.strategy} strategy`,
      },
      outliers: {
        name: "Outliers",
        description: `Processed outliers using ${step.strategy} method`,
      },
      encoding: {
        name: "Encoding",
        description: `Converted categorical columns using ${step.strategy} encoding`,
      },
      scaling: {
        name: "Scaling",
        description: `Scaled numerical features using ${step.strategy} method`,
      },
      feature_selection: {
        name: "Feature Selection",
        description: `Selected features using ${step.strategy} approach`,
      },
      imbalance: {
        name: "Imbalance Handling",
        description: `Balanced dataset using ${step.strategy} technique`,
      },
    }
    return (
      infoMap[step.type] || {
        name: step.type.replace(/_/g, " "),
        description: `Applied ${step.strategy} strategy`,
      }
    )
  }

  const shouldScroll = steps.length > 8 // Only enable scrolling for many steps

  return (
    <div className="mb-8">
      {/* Horizontal Scrollable Stepper - No Background Container */}
      <div className={shouldScroll ? "overflow-x-auto pb-2 custom-scrollbar" : "pb-2"}>
        <div className={`flex items-start gap-2 relative ${shouldScroll ? 'min-w-max' : 'justify-center'}`}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            const isHovered = hoveredStep === index
            const stepInfo = getStepInfo(step)

            return (
              <div key={index} className="flex items-start relative">
                {/* Step Node Column */}
                <div className="flex flex-col items-center">
                  {/* Step Button */}
                  <div
                    onMouseEnter={() => setHoveredStep(index)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className={`
                      group relative flex flex-col items-center gap-2
                      transition-all duration-200
                      hover:scale-110
                      cursor-pointer
                      ${isHovered ? "scale-110" : ""}
                    `}
                  >
                    {/* Circle with check - Smaller and More Premium */}
                    <div
                      className={`
                        relative flex items-center justify-center
                        w-8 h-8 rounded-full
                        font-semibold text-xs
                        border
                        transition-all duration-200
                        ${isHovered
                          ? "bg-green-500 border-green-400 text-white shadow-[0_0_16px_rgba(34,197,94,0.5)]"
                          : "bg-green-500 border-green-400 text-white hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                        }
                      `}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} />

                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 rounded-full bg-green-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>

                    {/* Step Label */}
                    <div className="text-center">
                      <div
                        className={`
                          text-[11px] font-medium whitespace-nowrap
                          transition-colors duration-200
                          ${isHovered
                            ? "text-green-400"
                            : "text-neutral-400 group-hover:text-green-400"
                          }
                        `}
                      >
                        {stepInfo.name}
                      </div>
                      <div className="text-[9px] text-neutral-600 mt-0.5">
                        Step {step.step_index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Vertical Info Panel - Appears Below Hovered Step */}
                  {isHovered && (
                    <div
                      className="absolute top-[72px] left-1/2 -translate-x-1/2 z-10
                        animate-in fade-in slide-in-from-top-1 duration-300 ease-out"
                      style={{
                        animationFillMode: "backwards",
                      }}
                      onMouseEnter={() => setHoveredStep(index)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      {/* Connecting Line from Circle to Panel */}
                      <div className="w-px h-3 bg-gradient-to-b from-green-500/50 to-green-500/20 mx-auto mb-2" />

                      {/* Vertical Info Card */}
                      <div className="w-56 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-sm rounded-lg border border-green-500/30 shadow-[0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden">
                        {/* Header with Step Number */}
                        <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 border-b border-green-500/20 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">
                                {steps[hoveredStep].step_index + 1}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {getStepInfo(steps[hoveredStep]).name}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-3 space-y-3">
                          {/* Strategy */}
                          <div>
                            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                              Method
                            </div>
                            <div className="text-xs font-medium text-green-400 bg-green-500/10 rounded px-2 py-1 inline-block border border-green-500/20">
                              {steps[hoveredStep].strategy}
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                              Details
                            </div>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {getStepInfo(steps[hoveredStep]).description}
                            </p>
                          </div>

                          {/* Affected Columns */}
                          <div>
                            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
                              Columns
                            </div>
                            {steps[hoveredStep].columns.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                {steps[hoveredStep].columns.map((col, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center bg-neutral-800/60 text-green-300 rounded px-2 py-0.5 text-[10px] font-medium border border-green-500/20"
                                  >
                                    {col}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-500 italic">
                                All applicable columns
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thin Connector Line - More Minimal */}
                {!isLast && (
                  <div className="w-10 h-px bg-green-500/30 mt-4 mx-1.5" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
