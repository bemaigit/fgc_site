import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Página não encontrada
        </h2>
        <p className="text-gray-600 mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-[#08285d] text-white py-2 px-4 rounded-md hover:bg-[#7db0de] transition-colors"
        >
          Voltar para o Dashboard
        </Link>
      </div>
    </div>
  )
}
