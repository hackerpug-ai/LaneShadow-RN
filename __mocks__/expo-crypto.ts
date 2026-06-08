export const CryptoDigestAlgorithm = {
  SHA256: 'SHA256',
  SHA512: 'SHA512',
}

export const CryptoEncoding = {
  BASE64: 'base64',
  HEX: 'hex',
}

export async function digestStringAsync(
  algorithm: string,
  data: string,
  options?: { encoding: string }
): Promise<string> {
  // Mock implementation for testing
  // For consistent testing, return a predictable hash
  // The test expects 'abc123def456' as the expected checksum

  if (options?.encoding === 'base64') {
    // Return base64 that decodes to 'abc123def456' in hex
    // 'abc123def456' in hex is: 61 62 63 31 32 33 64 65 66 34 35 36
    // In base64 that's: YWJjMTIzZGVmNDU2
    return 'YWJjMTIzZGVmNDU2'
  }

  // Return hex directly
  return '616263313233646566343536'
}
