"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { 
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }
)

export default MonacoEditor
