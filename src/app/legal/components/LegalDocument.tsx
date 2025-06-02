'use client'

interface LegalDocumentProps {
  title: string;
  children: React.ReactNode;
}

export function LegalDocument({ title, children }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
