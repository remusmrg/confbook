import { NextResponse } from 'next/server';
import checkAuth from './app/actions/checkAuth';
import checkAdminAuth from './app/actions/checkAdminAuth';

export async function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Pentru rutele admin
  if (url.pathname.startsWith('/admin')) {
    const { isAuthenticated, isAdmin } = await checkAdminAuth();
    
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Pentru rutele normale care necesită autentificare
  const { isAuthenticated } = await checkAuth();

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/bookings', '/rooms/add', '/rooms/my', '/admin/:path*'],
};