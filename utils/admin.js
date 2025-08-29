// utils/admin.js

/**
 * Verifică dacă un utilizator are rol de admin
 */
export function isAdmin(user) {
  return user && user.labels && user.labels.includes('admin');
}

/**
 * Verifică dacă utilizatorul curent este admin în context client
 */
export function checkAdminAccess(currentUser) {
  if (!currentUser) {
    return { isAdmin: false, error: 'Nu sunteți autentificat' };
  }
  
  if (!isAdmin(currentUser)) {
    return { isAdmin: false, error: 'Nu aveți permisiuni de administrator' };
  }
  
  return { isAdmin: true };
}