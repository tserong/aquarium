import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  StatusStageEnum,
  Status,
  StatusService
} from '~/app/shared/services/api/status.service';

@Injectable({
  providedIn: 'root'
})
export class StatusRouteGuardService implements CanActivate, CanActivateChild {
  constructor(private router: Router, private statusService: StatusService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.statusService.status().pipe(
      catchError((err) => {
        // Do not show an error notification.
        if (_.isFunction(err.preventDefault)) {
          err.preventDefault();
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const res: Status = {
          deployment_state: {
            last_modified: 'now',
            stage: StatusStageEnum.unknown
          }
        };
        return of(res);
      }),
      map((res: Status) => {
        let url: string;
        let result: boolean | UrlTree;
        console.info("=> deployment stage: ", res.deployment_state.stage);
        switch (res.deployment_state.stage) {
          case StatusStageEnum.bootstrapping:
            url = '/installer/create/bootstrap';
            if (url === state.url) {
              result = true;
            } else {
              result = this.router.parseUrl(url);
            }
            break;
          case StatusStageEnum.bootstrapped:
            const urls = ['/installer/create/deployment', '/dashboard'];
            if (urls.includes(state.url)) {
              result = true;
            } else {
              result = this.router.parseUrl(urls[0]);
            }
            break;
          case StatusStageEnum.ready:
            url = '/dashboard';
            if (url === state.url) {
              result = true;
            } else {
              result = this.router.parseUrl(url);
            }
            break;
          case StatusStageEnum.none:
            if (
              [
                '/installer/welcome',
                '/installer/install-mode',
                '/installer/create/bootstrap'
              ].includes(state.url)
            ) {
              result = true;
            } else {
              result = this.router.parseUrl('/installer');
            }
            break;
          default:
            result = true;
        }
        return result;
      })
    );
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }
}
