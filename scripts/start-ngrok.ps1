# Script para iniciar o Ngrok com Docker
# Uso: .\start-ngrok.ps1 [porta] [authtoken]

param (
    [Parameter(Position=0)]
    [int]$Port = 3000,
    
    [Parameter(Position=1)]
    [string]$AuthToken = "2t63zAHibQTagnPOBrvqj3WJlip_5jUfJQnDbDDn7xbXmnomo"
)

# Verificar se o AuthToken foi fornecido ou usar o padrão da FGC
if ($AuthToken -eq "") {
    $AuthToken = "2t63zAHibQTagnPOBrvqj3WJlip_5jUfJQnDbDDn7xbXmnomo"
}

Write-Host "Iniciando Ngrok para a porta $Port..."
Write-Host "Use Ctrl+C para interromper o túnel quando terminar."
Write-Host "IMPORTANTE: Anote a URL fornecida pelo Ngrok para acessar sua aplicação!"

# Iniciar o Ngrok com o AuthToken fornecido
docker run --rm -it -e NGROK_AUTHTOKEN=$AuthToken --net=host ngrok/ngrok:latest http $Port
