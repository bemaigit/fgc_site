import { Client } from 'minio'

interface StorageProvider {
  upload(params: {
    file: Buffer
    filename: string
    path: string
    contentType: string
  }): Promise<string>
  delete(path: string): Promise<void>
  getUrl(path: string): string
}

class MinioStorageProvider implements StorageProvider {
  private client: Client
  private bucket: string
  private endpoint: string

  constructor() {
    this.bucket = 'fgc'
    this.endpoint = process.env.MINIO_ENDPOINT || 'localhost'

    this.client = new Client({
      endPoint: this.endpoint,
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
    })
  }

  async upload({ file, filename, path, contentType }: {
    file: Buffer
    filename: string
    path: string
    contentType: string
  }): Promise<string> {
    const fullPath = `${path}/${filename}`
    await this.client.putObject(this.bucket, fullPath, file, undefined, {
      'Content-Type': contentType
    })
    return this.getUrl(fullPath)
  }

  async delete(path: string): Promise<void> {
    await this.client.removeObject(this.bucket, path)
  }

  getUrl(path: string): string {
    return `${process.env.MINIO_PUBLIC_URL}/${this.bucket}/${path}`
  }
}

export const storage = new MinioStorageProvider()
