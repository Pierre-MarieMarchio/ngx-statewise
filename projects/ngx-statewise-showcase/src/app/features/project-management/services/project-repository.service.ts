import { HttpClient,  } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = environment.API_BASE_URL;
}
