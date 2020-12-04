import fetch from 'node-fetch';
import { IP_DUPLICATION_KEY } from './constants';

export async function lookupIpCheck(ip: string) {
  if (!IP_DUPLICATION_KEY) return true
  if (ip === '127.0.0.1') return true;
  if (ip.startsWith('0.')) return true;
  const url = `https://ipqualityscore.com/api/json/ip/${IP_DUPLICATION_KEY}/${ip}?strictness=0&allow_public_access_points=true&fast=true&lighter_penalties=true&mobile=true`
  const result = await fetch(url).then(x => x.json());
  if('fraud_score' in result) {
    return !(result.mobile ? result.fraud_score > 85 : (result.fraud_score > 70 || result.vpn));
  } else {
    throw new Error('Cannot call IP Duplication API.');
  }
}
