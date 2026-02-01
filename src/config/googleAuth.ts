/**
 * Google Sign-In Configuration (NOT YET IMPLEMENTED)
 * 
 * To enable Google Sign-In in the future:
 * 
 * 1. Setup Google Cloud Console:
 *    - Go to: https://console.cloud.google.com
 *    - Create/select project
 *    - Enable Google Sign-In API
 * 
 * 2. Create OAuth 2.0 Client IDs:
 *    - iOS Client ID (requires Bundle ID)
 *    - Android Client ID (requires SHA-1 certificate)
 *    - Web Client ID (for Firebase)
 * 
 * 3. Configure OAuth Consent Screen:
 *    - Add app name, logo, privacy policy
 *    - Add authorized domains
 * 
 * 4. Update Firebase Console:
 *    - Enable Google Sign-In provider
 *    - Add Web Client ID
 * 
 * 5. Update expo app.json:
 *    - Add scheme for OAuth redirect
 * 
 * 6. Install packages:
 *    npx expo install expo-auth-session expo-crypto expo-web-browser
 * 
 * 7. Uncomment the code below and fill in the client IDs
 * 
 * 8. Add to FirebaseAuthService.ts:
 *    - Import GoogleAuthProvider and signInWithCredential from firebase/auth
 *    - Create signInWithGoogle(idToken: string) method
 * 
 * 9. Add to LoginScreen.tsx:
 *    - Import useGoogleAuth hook
 *    - Add useEffect to handle Google response
 *    - Add "Continue with Google" button
 */

/*
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const EXPO_CLIENT_ID = 'YOUR_EXPO_CLIENT_ID';
const IOS_CLIENT_ID = '569353742801-YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '569353742801-YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const WEB_CLIENT_ID = '569353742801-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};
*/

// Empty export to make this a valid module
export { };
