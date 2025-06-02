export function downloadFile(url: string, filename: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      // Em vez de manipular o DOM, vamos usar a API nativa do navegador
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadUrl
      a.download = filename

      // Dispara o evento de clique sem anexar ao DOM
      a.click()

      // Limpar URL após um breve delay
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        resolve()
      }, 100)

    } catch (error) {
      reject(error)
    }
  })
}
