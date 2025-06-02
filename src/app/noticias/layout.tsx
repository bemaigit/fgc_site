import { Header } from "@/components/home/Header"
import { HomeFooter } from "@/components/home/Footer"

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        {children}
      </div>
      <HomeFooter />
    </div>
  )
}
