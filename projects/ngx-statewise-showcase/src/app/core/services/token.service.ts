import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private generateRandomBase64UrlString(length: number): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  generateFakeJWT(): string {
    const headerLength = 36;
    const payloadLength = 350;
    const signatureLength = 43;

    const header = this.generateRandomBase64UrlString(headerLength);
    const payload = this.generateRandomBase64UrlString(payloadLength);
    const signature = this.generateRandomBase64UrlString(signatureLength);

    return `${header}.${payload}.${signature}`;
  }
}
