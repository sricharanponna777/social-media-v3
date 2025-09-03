// Tiny JWT parser without external deps
// Safely decodes base64url payload and parses JSON

function base64UrlDecode(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) str += '='.repeat(4 - pad);

  let output = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (c === '=') break;
    const v = chars.indexOf(c);
    if (v === -1) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  try {
    // decodeURIComponent trick to handle UTF-8 properly
    return decodeURIComponent(
      output.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  } catch {
    return output;
  }
}

export function parseJwt(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

