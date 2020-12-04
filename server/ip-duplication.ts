import ProxyCheck from 'proxycheck-node.js';
import { IP_DUPLICATION_KEY } from './constants';

const pc = new ProxyCheck({ api_key: IP_DUPLICATION_KEY });

export async function lookupIpCheck(ip: string) {
  if (!IP_DUPLICATION_KEY) return true
  if (ip === '127.0.0.1') return true;
  if (ip.startsWith('0.')) return true;
  
  const check = await pc.check(ip, { vpn: true }); 
  
  if (check.status === 'ok') {
    return check[ip].proxy === 'no';
  } else {
    throw new Error('Not OK');
  }
}
