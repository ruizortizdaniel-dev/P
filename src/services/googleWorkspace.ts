import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

/**
 * Initialize Firebase Auth listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Google Sign In with Drive and Gmail scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Gracefully handle user cancellation or popup suppression without logging errors
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google sign-in popup was closed by user');
      return null;
    }

    if (error?.code === 'auth/popup-blocked') {
      const userErr = new Error('El navegador ha bloqueado la ventana emergente. Permite las ventanas emergentes en tu navegador para continuar.');
      (userErr as any).code = 'auth/popup-blocked';
      throw userErr;
    }

    console.warn('Google Sign In notice:', error?.code || error?.message);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Fetch files from Google Drive
 */
export async function fetchDriveFiles(searchTerm?: string): Promise<DriveFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Se requiere iniciar sesión con Google');

  let query = 'trashed = false';
  if (searchTerm && searchTerm.trim()) {
    const escaped = searchTerm.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', '35');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)');
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sesión de Google caducada. Por favor, vuelve a conectar.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al obtener archivos de Google Drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch emails from Gmail (patrol chief mailbox)
 */
export async function fetchGmailMessages(searchTerm?: string): Promise<GmailMessageItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Se requiere iniciar sesión con Google');

  const listUrl = new URL('https://www.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('maxResults', '25');
  if (searchTerm && searchTerm.trim()) {
    listUrl.searchParams.set('q', searchTerm.trim());
  }

  const listRes = await fetch(listUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!listRes.ok) {
    if (listRes.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sesión de Google caducada. Por favor, vuelve a conectar.');
    }
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al obtener correos de Gmail');
  }

  const listData = await listRes.json();
  const rawMessages: Array<{ id: string; threadId: string }> = listData.messages || [];

  if (rawMessages.length === 0) return [];

  // Fetch metadata details for the messages
  const messagePromises = rawMessages.slice(0, 20).map(async (msg) => {
    try {
      const detailUrl = new URL(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
      detailUrl.searchParams.set('format', 'metadata');
      detailUrl.searchParams.append('metadataHeaders', 'Subject');
      detailUrl.searchParams.append('metadataHeaders', 'From');
      detailUrl.searchParams.append('metadataHeaders', 'Date');

      const detailRes = await fetch(detailUrl.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();

      const headers = detailData.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: getHeader('Subject') || '(Sin asunto)',
        from: getHeader('From') || '(Remitente desconocido)',
        date: getHeader('Date') || '',
        snippet: detailData.snippet || ''
      };
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(messagePromises);
  return resolved.filter((m): m is GmailMessageItem => m !== null);
}
