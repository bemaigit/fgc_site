'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchableCheckboxListProps {
  items: Array<{ id: string; name: string; modalityId?: string }>;
  selectedIds: string[];
  onChange: (id: string, checked: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  searchPlaceholder?: string;
  groupBy?: string;
  maxHeight?: string;
  renderItem?: (
    item: { id: string; name: string; modalityId?: string },
    isSelected: boolean,
    onChange: (checked: boolean) => void
  ) => React.ReactNode;
}

export function SearchableCheckboxList({
  items = [],
  selectedIds = [],
  onChange,
  isLoading = false,
  disabled = false,
  emptyMessage = "Nenhum item disponível",
  loadingMessage = "Carregando...",
  searchPlaceholder = "Buscar...",
  groupBy,
  maxHeight = "300px",
  renderItem
}: SearchableCheckboxListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAll, setShowAll] = useState(false)

  // Filtrar itens baseado na busca
  const filteredItems = useMemo(() => {
    const safeItemsArray = Array.isArray(items) ? items : [];
    const query = searchQuery?.toLowerCase().trim()
    let result = safeItemsArray

    if (query) {
      result = result.filter(item => 
        item?.name?.toLowerCase().includes(query)
      )
    }

    return result
  }, [items, searchQuery])

  // Agrupar itens se necessário
  const groupedItems = useMemo(() => {
    if (!groupBy) {
      return { undefined: filteredItems }
    }

    return filteredItems.reduce((acc, item) => {
      const groupKey = (item[groupBy as keyof typeof item] as string) || 'undefined'
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(item)
      return acc
    }, {} as Record<string, typeof filteredItems>)
  }, [filteredItems, groupBy])

  // Contar itens selecionados
  const selectedCount = useMemo(() => Array.isArray(selectedIds) ? selectedIds.length : 0, [selectedIds])

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled || isLoading}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Selecionados {selectedCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            disabled={disabled || isLoading}
          >
            {showAll ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Container com altura fixa e scroll interno */}
      <div className="border rounded-md">
        <div 
          className="overflow-y-auto" 
          style={{ 
            height: maxHeight,
            maxHeight: maxHeight
          }}
        >
          <div className="p-2 min-h-[50px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                {loadingMessage}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {searchQuery ? "Nenhum resultado encontrado" : emptyMessage}
              </div>
            ) : (
              Object.entries(groupedItems).map(([group, groupItems]) => (
                <div key={group} className="mb-3 last:mb-0">
                  {groupBy && group !== 'undefined' && (
                    <div className="sticky top-0 z-10 mb-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase bg-background/95 backdrop-blur-sm">
                      {group}
                    </div>
                  )}
                  <div className="space-y-1">
                    {groupItems.map((item) => (
                      <div key={item?.id || Math.random()}>
                        {renderItem ? 
                          renderItem(
                            item, 
                            Array.isArray(selectedIds) && selectedIds.includes(item.id), 
                            (checked) => onChange(item.id, checked)
                          ) : 
                          <div 
                            className={cn(
                              "flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer transition-colors",
                              disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 active:bg-muted/70",
                              Array.isArray(selectedIds) && selectedIds.includes(item.id) && "bg-muted/30"
                            )}
                            onClick={() => {
                              if (!disabled) {
                                onChange(item.id, !Array.isArray(selectedIds) || !selectedIds.includes(item.id))
                              }
                            }}
                          >
                            <div 
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary transition-colors",
                                Array.isArray(selectedIds) && selectedIds.includes(item.id) && "bg-primary text-primary-foreground",
                                disabled && "opacity-50"
                              )}
                            >
                              {Array.isArray(selectedIds) && selectedIds.includes(item.id) && <Check className="h-3 w-3" />}
                            </div>
                            <span 
                              className={cn(
                                "text-sm flex-1 truncate",
                                Array.isArray(selectedIds) && selectedIds.includes(item.id) && "font-medium"
                              )}
                            >
                              {item.name || 'Sem nome'}
                            </span>
                          </div>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
