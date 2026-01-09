"use client";

import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";


// File upload component with drag-and-drop functionality
export const FileUpload = ({ onChange }: { onChange?: (files: File[]) => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection and update state
  const handleFileChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => fileInputRef.current?.click();

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
  });

  return (
    <div {...getRootProps()} className={`
      w-full
    `}>
      <motion.div
        onClick={handleClick}
        className={`
          p-10
          block
          rounded-2xl
          cursor-pointer
          w-full
          relative
          overflow-hidden
          border
          border-white/15
          hover:border-white
          transition-colors
        `}
      >

        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />

        <div className={`
          flex
          flex-col
          items-center
          justify-center
        `}>
          <p className={`
            relative
            z-20
            font-bold
            text-neutral-200
            text-base
          `}>
            Upload file
          </p>

          <p className={`
            relative
            z-20
            text-neutral-400
            text-base
            mt-2
          `}>
            Drag or drop your files here or click to upload
          </p>

          <div className={`
            relative
            w-full
            mt-10
            max-w-xl
            mx-auto
          `}>

            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40",
                    "bg-white/10 dark:bg-black/20",
                    "backdrop-blur-xl",
                    "border border-white/10",
                    "flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-none"
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <motion.p className={`
                          text-neutral-100
                          truncate
                          max-w-xs
                        `}>
                      {file.name}
                    </motion.p>

                    <motion.p className={`
                      rounded-lg
                      px-2
                      py-1
                      text-sm
                      text-white
                      bg-black/40
                    `}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>
                </motion.div>
              ))}

            {!files.length && (
              <motion.div
                layoutId="file-upload"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                  relative
                  z-40
                  flex
                  items-center
                  justify-center
                  h-32
                  w-full
                  max-w-[8rem]
                  mx-auto
                  rounded-xl
                  bg-white/10
                  dark:bg-black/30
                  backdrop-blur-xl
                  border
                  border-white/20
                  hover:border-white
                  transition-colors
                `}

              >
                {isDragActive ? (
                  <motion.p className="text-neutral-200 flex flex-col items-center">
                    Drop it
                    <IconUpload className="h-4 w-4 text-neutral-300" />
                  </motion.p>
                ) : (
                  <IconUpload className="h-5 w-5 text-neutral-200" />
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
