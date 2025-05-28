// src/app/auth/jwt.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * JwtInterceptor is an HTTP interceptor that adds the JWT token to the request headers.
 * It checks if the user is authenticated and if the request URL is not in the excluded list.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private auth: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.auth.getToken();
        if (!token) {
            return next.handle(req); // pass request to the next handler
        }

        // list of URLs to exclude from the interceptor
        const excludedUrls = ['/auth/login', '/auth/register'];

        // check if the request URL is in the excluded list
        if (excludedUrls.some((url) => req.url.includes(url))) {
            return next.handle(req); // pass request to the next handler
        }

        const cloned = req.clone({
            // clone the request to add the new header (requests are immutable)
            headers: req.headers.set('Authorization', `Bearer ${token}`), // add the token to the request headers
        });
        return next.handle(cloned); // pass the cloned request instead of the original to the next handler
    }
}
