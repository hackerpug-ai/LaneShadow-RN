export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
}

export const documentDirectory = '/mock/documents/'

export async function readAsStringAsync(filePath: string, options?: { encoding: string }): Promise<string> {
  // Mock implementation for testing
  return 'mock-file-content'
}

export async function getInfoAsync(filePath: string): Promise<any> {
  // Mock implementation for testing
  // Check if this was a downloaded file
  const downloadedFiles = (global as any).__mockDownloadedFiles || {}

  // Check if we have a partial file size stored separately
  const partialFiles = (global as any).__mockPartialFiles || {}

  if (downloadedFiles[filePath]) {
    return {
      exists: true,
      size: downloadedFiles[filePath].size,
      uri: filePath,
      isDirectory: false,
      modificationTime: 1234567890,
    }
  }

  if (partialFiles[filePath]) {
    return {
      exists: true,
      size: partialFiles[filePath].size,
      uri: filePath,
      isDirectory: false,
      modificationTime: 1234567890,
    }
  }

  return {
    exists: false,
    uri: filePath,
    isDirectory: false,
    modificationTime: 0,
  }
}

export async function makeDirectoryAsync(
  dirPath: string,
  options?: { intermediates: boolean }
): Promise<void> {
  // Mock implementation for testing
}

export async function downloadAsync(
  url: string,
  filePath: string,
  options?: { headers?: Record<string, string> }
): Promise<any> {
  // Mock implementation for testing
  // Store the file path and size for getInfoAsync to retrieve
  ;(global as any).__mockDownloadedFiles = (global as any).__mockDownloadedFiles || {}

  // Check if this is a resume request (has Range header)
  const rangeHeader = options?.headers?.Range
  if (rangeHeader) {
    // Extract the starting byte from Range header (e.g., "bytes=377487360-")
    const match = rangeHeader.match(/bytes=(\d+)-/)
    if (match) {
      const startByte = parseInt(match[1], 10)
      // For resume, set the size to full 800MB
      ;(global as any).__mockDownloadedFiles[filePath] = {
        size: 800 * 1024 * 1024, // 800MB - full download complete
      }
      return {
        status: 206, // Partial Content
        headers: { 'content-range': `bytes ${startByte}-838860800/838860800` },
        mimeType: 'application/octet-stream',
        uri: filePath,
      }
    }
  }

  // New download
  ;(global as any).__mockDownloadedFiles[filePath] = {
    size: 800 * 1024 * 1024, // 800MB
  }

  return {
    status: 200,
    headers: {},
    mimeType: 'application/octet-stream',
    uri: filePath,
  }
}

export async function deleteAsync(filePath: string): Promise<void> {
  // Mock implementation for testing
  // Remove from downloaded files
  const downloadedFiles = (global as any).__mockDownloadedFiles || {}
  delete downloadedFiles[filePath]
}

export async function getFreeDiskStorageAsync(): Promise<number> {
  // Mock implementation for testing - return 3GB
  return 3 * 1024 * 1024 * 1024
}
