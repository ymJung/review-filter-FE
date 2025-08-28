# Naver Login Fix

## Issue
The Naver login was failing with a "Cannot read properties of null (reading 'firstChild')" error and redirecting to a callback URL that returned a 404 page.

## Solution
1. **Fixed the Naver SDK initialization error** by properly handling the popup-based authentication flow
2. **Created a proper callback handler** at `/auth/naver/callback` to process the OAuth response
3. **Implemented cross-window communication** using `postMessage` to send the access token from the popup back to the main window
4. **Added proper error handling** for popup blocking and timeout scenarios

## How it works
1. When the user clicks "네이버로 로그인", a popup window opens to Naver's OAuth authorization page
2. After successful authentication, Naver redirects to our callback page (`/auth/naver/callback`) with the access token in the URL hash
3. The callback page extracts the access token and sends it to the opener window using `postMessage`
4. The opener window receives the message, fetches the user's profile from Naver's API, and completes the login process
5. The popup window is automatically closed after sending the message

## Files Modified
- `src/lib/auth/social.ts` - Updated `signInWithNaver` function to use popup-based authentication
- `src/app/auth/naver/callback/page.tsx` - Created callback handler page

## Testing
To test the Naver login:
1. Go to `http://localhost:3000/login`
2. Click the "네이버로 로그인" button
3. Complete the authentication in the popup window
4. The popup should close automatically and you should be logged in

The callback page can also be tested directly by visiting `http://localhost:3000/auth/naver/callback` with appropriate URL parameters.