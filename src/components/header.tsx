"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()
  
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo-fgc.png" 
              alt="Logo FGC" 
              width={32} 
              height={32} 
              className="h-8 w-auto" 
            />
            <span className="font-bold">FGC</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost">Voltar ao Início</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
