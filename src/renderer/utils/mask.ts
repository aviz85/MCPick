// Mask sensitive data like API keys, IDs, or other long sequences
export function maskSensitiveValue(value: string): string {
  if (!value) return value;
  let result = value;
  
  try {
    // Skip processing for npm package names and file paths
    if (isNpmPackage(result) || isFilePath(result)) {
      return result;
    }
    
    // Find and mask long sequences of alphanumeric characters and hyphens (16+ chars)
    const longIdRegex = /([a-zA-Z0-9\-_]{16,})/g;
    let match;
    let lastIndex = 0;
    let maskedResult = '';
    
    // Reset regex state
    longIdRegex.lastIndex = 0;
    
    // Manually iterate through matches to avoid potential issues
    while ((match = longIdRegex.exec(result)) !== null) {
      const id = match[1];
      const startIndex = match.index;
      
      // Skip masking if the match contains a path separator or is part of a package name
      if (id.includes('/') || id.includes('\\') || id.startsWith('@')) {
        maskedResult += result.substring(lastIndex, startIndex + id.length);
      } else {
        // For very long strings, keep fewer visible characters
        const charsToShow = Math.min(4, Math.floor(id.length / 6));
        const maskedId = `${id.substring(0, charsToShow)}${'*'.repeat(Math.min(8, id.length - (charsToShow * 2)))}${id.substring(id.length - charsToShow)}`;
        
        // Add text before this match and the masked ID
        maskedResult += result.substring(lastIndex, startIndex) + maskedId;
      }
      
      // Update lastIndex for next iteration
      lastIndex = startIndex + id.length;
    }
    
    // Add any remaining text after the last match
    if (lastIndex < result.length) {
      maskedResult += result.substring(lastIndex);
    }
    
    // If we found and masked something, update the result
    if (lastIndex > 0) {
      result = maskedResult;
    }
    
    // Special case for service names - don't mask commands and common packages
    const commonNames = ['make', 'node', 'npm', 'npx', 'yarn', 'bash', 'python', 'docker'];
    commonNames.forEach(name => {
      // For each common name, make sure we don't mask it
      const regex = new RegExp(`(${name})(\\*+)`, 'gi');
      result = result.replace(regex, `$1`);
    });
    
    // Look for common API key prefixes - be more selective
    const commonPrefixes = ['sk-', 'pk-', 'api-', 'key-', 'token-', 'secret-'];
    for (const prefix of commonPrefixes) {
      if (result.startsWith(prefix) && result.length > prefix.length + 10) { // Only mask if it's a longer key
        return `${prefix}${'*'.repeat(Math.min(8, result.length - prefix.length))}`;
      }
    }
  } catch (error) {
    // If any errors in masking, return original
    console.error('Error in masking function:', error);
  }
  
  return result;
}

// Function to check if a string is an npm package name
export function isNpmPackage(str: string): boolean {
  // Check for scoped packages (starting with @)
  if (str.startsWith('@')) {
    return true;
  }
  
  // Check for package paths format like package/subpackage
  if (/^[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+/.test(str)) {
    return true;
  }
  
  // Known package prefixes
  const packagePrefixes = ['@model', '@openai', '@claude', '@anthropic', '@mcp', 
                         'server-', 'react-', 'vue-', 'angular-', 'node-'];
  
  for (const prefix of packagePrefixes) {
    if (str.includes(prefix)) {
      return true;
    }
  }
  
  return false;
}

// Function to check if a string is a file path
export function isFilePath(str: string): boolean {
  // Check for absolute and relative paths
  if (str.includes('/') || str.includes('\\')) {
    return true;
  }
  
  // Check for Windows-style drive letters
  if (/^[a-zA-Z]:\\/.test(str)) {
    return true;
  }
  
  // Check for URL paths
  if (/^https?:\/\//.test(str)) {
    return true;
  }
  
  return false;
} 