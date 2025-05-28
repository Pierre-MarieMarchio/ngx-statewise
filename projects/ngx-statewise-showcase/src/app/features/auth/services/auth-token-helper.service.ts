import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../models';


@Injectable({ providedIn: 'root' })
export class AuthTokenHelperService {
  decode(token: string): AccessToken | null {
    try {
      return jwtDecode<AccessToken>(token);
    } catch {
      return null;
    }
  }

  getPayload(decoded: AccessToken) {
    return {
      userId:
        decoded[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ],
      userName:
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      email:
        decoded[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ],
      role: decoded[
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
      ],
      organizationId: decoded['organizationId'],
    };
  }
}
