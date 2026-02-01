"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { submitOnboardingData } from "@/services/onboarding.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb } from "@/components/ui/step-breadcrumb";
import { cn } from "@/lib/utils";

const steps = [
  { id: "username", title: "Username" },
  { id: "professional", title: "Professional" },
  { id: "experience", title: "Data Experience" },
  { id: "goals", title: "Goals" },
  { id: "preferences", title: "Preferences" },
  { id: "additional", title: "Additional" },
];

interface FormData {
  username: string;
  name: string;
  email: string;
  company: string;
  profession: string;
  experience: string;
  industry: string;
  dataExperience: string;
  toolsUsed: string[];
  primaryGoal: string;
  projectTypes: string[];
  dataTypes: string[];
  preferredFeatures: string[];
  additionalInfo: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

interface UserInfoFormProps {
  onComplete: (data: FormData) => void;
  initialData?: Partial<FormData>;
}

const UserInfoForm = ({ onComplete, initialData }: UserInfoFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: initialData?.username || "",
    name: initialData?.name || "",
    email: initialData?.email || "",
    company: initialData?.company || "",
    profession: "",
    experience: "",
    industry: "",
    dataExperience: "",
    toolsUsed: [],
    primaryGoal: "",
    projectTypes: [],
    dataTypes: [],
    preferredFeatures: [],
    additionalInfo: "",
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field] as string[];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter((item) => item !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  const nextStep = () => {
    if (isStepValid() && currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.username) {
      console.error('Username is required for onboarding submission');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOnboardingData(formData);
      onComplete(formData);
    } catch (error) {
      console.error('Failed to submit onboarding data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Username
        return formData.username.trim() !== "";
      case 2: // Professional
        return formData.profession.trim() !== "" && formData.industry.trim() !== "";
      case 3: // Data Experience
        return formData.dataExperience.trim() !== "" && formData.toolsUsed.length > 0;
      case 4: // Goals
        return formData.primaryGoal.trim() !== "" && formData.projectTypes.length > 0;
      case 5: // Preferences
        return formData.dataTypes.length > 0 && formData.preferredFeatures.length > 0;
      case 6: // Additional (optional)
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      {/* Progress indicator */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb
          className="overflow-visible -ml-20"
          steps={steps.map((step, index) => {
            let status: "complete" | "current" | "upcoming" = "upcoming";

            if (index < currentStep - 1) {
              status = "complete";
            } else if (index === currentStep - 1) {
              // Check if current step has valid data to show as complete
              const isCurrentStepComplete = (() => {
                switch (currentStep) {
                  case 1: return formData.username.trim() !== "";
                  case 2: return formData.profession.trim() !== "" && formData.industry.trim() !== "";
                  case 3: return formData.dataExperience.trim() !== "" && formData.toolsUsed.length > 0;
                  case 4: return formData.primaryGoal.trim() !== "" && formData.projectTypes.length > 0;
                  case 5: return formData.dataTypes.length > 0 && formData.preferredFeatures.length > 0;
                  case 6: return true; // Additional info is optional
                  default: return false;
                }
              })();
              status = isCurrentStepComplete ? "complete" : "current";
            }

            return {
              id: String(index + 1).padStart(2, '0'),
              name: step.title,
              status
            };
          })}
        />
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border border-[#2A2A2A] shadow-md rounded-3xl overflow-hidden bg-[#0B0B0B]">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
              >
                {/* Step 1: Username */}
                {currentStep === 1 && (
                  <>
                    <CardHeader>
                      <CardTitle>Create Your Username</CardTitle>
                      <CardDescription className="mt-4">
                        Choose a unique username for your DataForge account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="your_userid"
                          value={formData.username}
                          onChange={(e) =>
                            updateFormData("username", e.target.value)
                          }
                          className="bg-[#080808] border-[#2C2C2C] text-white placeholder:text-[#6F6F6F] focus:border-[#4A4A4A] transition-all duration-300"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Professional Background */}
                {currentStep === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle>Professional Background</CardTitle>
                      <CardDescription className="mt-4">
                        Tell us about your professional experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <Label htmlFor="profession">
                          What's your profession?
                        </Label>
                        <Input
                          id="profession"
                          placeholder="e.g. Data Scientist, Analyst, Researcher"
                          value={formData.profession}
                          onChange={(e) =>
                            updateFormData("profession", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-4">
                        <Label htmlFor="industry">
                          What industry do you work in?
                        </Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) =>
                            updateFormData("industry", value)
                          }
                        >
                          <SelectTrigger
                            id="industry"
                            className="bg-[#080808] border-[#2C2C2C] text-white placeholder:text-[#6F6F6F] focus:border-[#4A4A4A] transition-all duration-300"
                          >
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0B0B0B] border-[#2A2A2A] text-[#9A9A9A]">
                            <SelectItem value="technology" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Technology</SelectItem>
                            <SelectItem value="healthcare" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Healthcare</SelectItem>
                            <SelectItem value="finance" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Finance</SelectItem>
                            <SelectItem value="education" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Education</SelectItem>
                            <SelectItem value="retail" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Retail</SelectItem>
                            <SelectItem value="manufacturing" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Manufacturing</SelectItem>
                            <SelectItem value="research" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Research</SelectItem>
                            <SelectItem value="other" className="text-[#9A9A9A] hover:bg-[#1A1A1A] hover:text-white">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Data Experience */}
                {currentStep === 3 && (
                  <>
                    <CardHeader>
                      <CardTitle>Data Experience</CardTitle>
                      <CardDescription className="mt-4">
                        How familiar are you with data analysis?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                      <motion.div variants={fadeInUp} className="space-y-6">
                        <Label>
                          What's your experience level with data analysis?
                        </Label>
                        <div className="mt-6">
                          <RadioGroup
                            value={formData.dataExperience}
                            onValueChange={(value) =>
                              updateFormData("dataExperience", value)
                            }
                            className="space-y-4"
                          >
                            {[
                              { value: "beginner", label: "Beginner - New to data analysis" },
                              { value: "intermediate", label: "Intermediate - Some experience" },
                              { value: "advanced", label: "Advanced - Experienced analyst" },
                              { value: "expert", label: "Expert - Data science professional" },
                            ].map((level, index) => (
                              <motion.div
                                key={level.value}
                                className="flex items-center space-x-3 rounded-md border-[0.5px] px-4 py-4 cursor-pointer hover:bg-accent transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{
                                  opacity: 1,
                                  x: 0,
                                  transition: {
                                    delay: 0.1 * index,
                                    duration: 0.3,
                                  },
                                }}
                              >
                                <RadioGroupItem
                                  value={level.value}
                                  id={`level-${index + 1}`}
                                />
                                <Label
                                  htmlFor={`level-${index + 1}`}
                                  className="cursor-pointer w-full"
                                >
                                  {level.label}
                                </Label>
                              </motion.div>
                            ))}
                          </RadioGroup>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-6">
                        <Label>Which tools have you used? (Select all that apply)</Label>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                          {[
                            "Excel", "Python", "R", "SQL", "Tableau", "Power BI", "SPSS", "SAS"
                          ].map((tool, index) => (
                            <motion.div
                              key={tool}
                              className="flex items-center space-x-3 rounded-md border-[0.5px] px-4 py-4 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() => toggleArrayField("toolsUsed", tool.toLowerCase())}
                            >
                              <Checkbox
                                id={`tool-${tool}`}
                                checked={formData.toolsUsed.includes(tool.toLowerCase())}
                                onCheckedChange={() => toggleArrayField("toolsUsed", tool.toLowerCase())}
                              />
                              <Label
                                htmlFor={`tool-${tool}`}
                                className="cursor-pointer w-full"
                              >
                                {tool}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 4: Goals */}
                {currentStep === 4 && (
                  <>
                    <CardHeader>
                      <CardTitle>Your Goals</CardTitle>
                      <CardDescription className="mt-3">
                        What do you want to achieve with DataForge?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <Label>
                          What's your primary goal?
                        </Label>
                        <div className="mt-4">
                          <RadioGroup
                            value={formData.primaryGoal}
                            onValueChange={(value) =>
                              updateFormData("primaryGoal", value)
                            }
                            className="space-y-3"
                          >
                            {[
                              { value: "learn", label: "Learn data analysis skills" },
                              { value: "clean", label: "Clean and prepare datasets" },
                              { value: "analyze", label: "Analyze data patterns" },
                              { value: "model", label: "Build machine learning models" },
                              { value: "automate", label: "Automate data workflows" },
                            ].map((goal, index) => (
                              <motion.div
                                key={goal.value}
                                className="flex items-center space-x-3 rounded-md border-[0.5px] px-4 py-3.5 cursor-pointer hover:bg-accent transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{
                                  opacity: 1,
                                  x: 0,
                                  transition: {
                                    delay: 0.1 * index,
                                    duration: 0.3,
                                  },
                                }}
                              >
                                <RadioGroupItem
                                  value={goal.value}
                                  id={`goal-${index + 1}`}
                                />
                                <Label
                                  htmlFor={`goal-${index + 1}`}
                                  className="cursor-pointer w-full"
                                >
                                  {goal.label}
                                </Label>
                              </motion.div>
                            ))}
                          </RadioGroup>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-4">
                        <Label>What types of projects interest you? (Select all that apply)</Label>
                        <div className="mt-4 grid grid-cols-1 gap-3">
                          {[
                            "Customer Analytics", "Sales Forecasting", "Risk Assessment",
                            "Market Research", "Quality Control", "Fraud Detection"
                          ].map((project, index) => (
                            <motion.div
                              key={project}
                              className="flex items-center space-x-3 rounded-md border-[0.5px] px-4 py-3.5 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() => toggleArrayField("projectTypes", project.toLowerCase())}
                            >
                              <Checkbox
                                id={`project-${project}`}
                                checked={formData.projectTypes.includes(project.toLowerCase())}
                                onCheckedChange={() => toggleArrayField("projectTypes", project.toLowerCase())}
                              />
                              <Label
                                htmlFor={`project-${project}`}
                                className="cursor-pointer w-full"
                              >
                                {project}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 5: Data Preferences */}
                {currentStep === 5 && (
                  <>
                    <CardHeader>
                      <CardTitle>Data Preferences</CardTitle>
                      <CardDescription className="mt-4">
                        What types of data do you work with?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                      <motion.div variants={fadeInUp} className="space-y-6">
                        <Label>What types of data do you typically work with?</Label>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                          {[
                            "CSV Files", "Excel Spreadsheets", "Database Tables", "JSON Data",
                            "Time Series", "Survey Data", "Financial Data", "Scientific Data"
                          ].map((dataType, index) => (
                            <motion.div
                              key={dataType}
                              className="flex items-center space-x-3 rounded-md border-[0.5px] px-4 py-4 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() => toggleArrayField("dataTypes", dataType.toLowerCase())}
                            >
                              <Checkbox
                                id={`datatype-${dataType}`}
                                checked={formData.dataTypes.includes(dataType.toLowerCase())}
                                onCheckedChange={() => toggleArrayField("dataTypes", dataType.toLowerCase())}
                              />
                              <Label
                                htmlFor={`datatype-${dataType}`}
                                className="cursor-pointer w-full"
                              >
                                {dataType}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-6">
                        <Label>Which features are most important to you?</Label>
                        <div className="mt-6 grid grid-cols-1 gap-3">
                          {[
                            "Automated Data Cleaning", "Visual Data Exploration", "Machine Learning Models",
                            "Statistical Analysis", "Data Export Options", "Collaboration Tools"
                          ].map((feature, index) => (
                            <motion.div
                              key={feature}
                              className="flex items-center space-x-3 rounded-md border-[0.5px] px-4 py-4 cursor-pointer hover:bg-accent transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() => toggleArrayField("preferredFeatures", feature.toLowerCase())}
                            >
                              <Checkbox
                                id={`feature-${feature}`}
                                checked={formData.preferredFeatures.includes(feature.toLowerCase())}
                                onCheckedChange={() => toggleArrayField("preferredFeatures", feature.toLowerCase())}
                              />
                              <Label
                                htmlFor={`feature-${feature}`}
                                className="cursor-pointer w-full"
                              >
                                {feature}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 6: Additional Information */}
                {currentStep === 6 && (
                  <>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                      <CardDescription className="mt-4">
                        Anything else you'd like us to know?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <motion.div variants={fadeInUp} className="space-y-6">
                        <Label htmlFor="additionalInfo">
                          Tell us more about your data analysis needs
                        </Label>
                        <Textarea
                          id="additionalInfo"
                          placeholder="Any specific challenges, requirements, or goals you'd like to share..."
                          value={formData.additionalInfo}
                          onChange={(e) =>
                            updateFormData("additionalInfo", e.target.value)
                          }
                          className="min-h-[100px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <CardFooter className="flex justify-between pt-8 pb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-1 transition-all duration-300 rounded-2xl bg-transparent border border-[#3A3A3A] text-[#9A9A9A] hover:bg-[#1A1A1A]"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  onClick={
                    currentStep === 6 ? handleSubmit : nextStep
                  }
                  disabled={!isStepValid() || isSubmitting}
                  className={cn(
                    "flex items-center gap-1 transition-all duration-300 rounded-2xl bg-[#D0D0D0] text-black hover:bg-[#E0E0E0]",
                    currentStep === steps.length - 1 ? "" : "",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Completing...
                    </>
                  ) : (
                    <>
                      {currentStep === 6 ? "Complete Setup" : "Next"}
                      {currentStep === 6 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </div>
        </Card>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        className="mt-4 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
      </motion.div>
    </div>
  );
};

export default UserInfoForm;