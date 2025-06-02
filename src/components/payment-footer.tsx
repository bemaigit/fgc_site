"use client"

import Link from "next/link"

export function PaymentFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Federação Goiana de Ciclismo. Todos os direitos reservados.
          </p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/termos" 
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Termos de Uso
          </Link>
          <Link 
            href="/privacidade" 
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
