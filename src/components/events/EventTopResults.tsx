import { useEventTopResults } from '@/hooks/useEventTopResults';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Download, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface EventTopResultsProps {
  eventId: string;
  resultsFileUrl?: string | null;
}

export function EventTopResults({ eventId, resultsFileUrl }: EventTopResultsProps) {
  const { data: topResults, isLoading, isError } = useEventTopResults(eventId);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Agrupar resultados por categoria
  const resultsByCategory = topResults.reduce((acc, result) => {
    const categoryId = result.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryId,
        categoryName: result.EventCategory?.name || 'Categoria',
        results: [],
      };
    }
    acc[categoryId].results.push(result);
    return acc;
  }, {} as Record<string, { categoryId: string; categoryName: string; results: any[] }>);

  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar os resultados</p>
      </div>
    );
  }

  if (topResults.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum resultado destacado disponível</p>
        {resultsFileUrl && (
          <div className="mt-4">
            <Button variant="outline" asChild>
              <a href={resultsFileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Ver Resultados Completos
              </a>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Resultados Destacados
        </h2>
        {resultsFileUrl && (
          <Button variant="outline" asChild>
            <a href={resultsFileUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Resultados Completos
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.values(resultsByCategory).map((category) => (
          <Card key={category.categoryId} className="overflow-hidden">
            <CardHeader className="bg-muted/50 cursor-pointer" onClick={() => toggleCategory(category.categoryId)}>
              <CardTitle className="text-xl">{category.categoryName}</CardTitle>
            </CardHeader>
            <CardContent className={`p-0 ${expandedCategory === category.categoryId ? 'block' : 'hidden'}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Clube</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.results
                    .sort((a, b) => a.position - b.position)
                    .map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <Badge 
                            variant={result.position <= 3 ? "default" : "outline"}
                            className={
                              result.position === 1 
                                ? "bg-yellow-500 hover:bg-yellow-600" 
                                : result.position === 2 
                                ? "bg-gray-400 hover:bg-gray-500" 
                                : result.position === 3 
                                ? "bg-amber-700 hover:bg-amber-800"
                                : ""
                            }
                          >
                            {result.position}º
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {result.User?.image ? (
                              <Image
                                src={result.User.image}
                                alt={result.athleteName}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                            {result.User ? (
                              <Link href={`/atletas/${result.userId}`} className="hover:underline">
                                {result.athleteName}
                              </Link>
                            ) : (
                              <span>{result.athleteName}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {result.Club ? (
                              <Link href={`/clubes/${result.clubId}`} className="hover:underline flex items-center">
                                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                                {result.clubName || result.Club.clubName}
                              </Link>
                            ) : (
                              result.clubName && (
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {result.clubName}
                                </span>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{result.result}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
