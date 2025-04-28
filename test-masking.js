// Test script for masking function

function maskSensitiveData(value) {
  if (!value || typeof value !== 'string') return value;
  
  let result = value;
  
  // Mask URLs with UUIDs or long IDs
  const urlWithIdPattern = /(https?:\/\/[^\/\s]+\/[^\/\s]*\/)([a-zA-Z0-9\-_]{10,})(\/[^\s]*)?/gi;
  result = result.replace(urlWithIdPattern, (_match, prefix, id, suffix = '') => {
    return `${prefix}${id.substring(0, 4)}****${id.substring(id.length - 4)}${suffix}`;
  });
  
  // Mask standalone UUIDs or long IDs
  const idPattern = /\b([a-zA-Z0-9\-_]{20,})\b/g;
  result = result.replace(idPattern, (_match, id) => {
    return `${id.substring(0, 4)}****${id.substring(id.length - 4)}`;
  });
  
  return result;
}

// Test cases
const testCases = [
  "https://eu1.make.com/mcp/api/v1/u/61f5352d-c973-4267-819c-f4f848810d74/sse",
  "bash -c pkill -f mcp-remote || true; exec npx -y mcp-remote",
  "61f5352d-c973-4267-819c-f4f848810d74",
  "some text with 61f5352d-c973-4267-819c-f4f848810d74 embedded in it",
  "bash -c pkill -f mcp-remote || true; exec npx -y mcp-remote https://eu1.make.com/mcp/api/v1/u/61f5352d-c973-4267-819c-f4f848810d74/sse",
  "sk-abcdefghijklmnopqrstuvwxyz12345",
  "api-key-12345678901234567890"
];

// Run tests
console.log("==== Masking Function Tests ====");
testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`Original: ${test}`);
  console.log(`Masked:   ${maskSensitiveData(test)}`);
}); 