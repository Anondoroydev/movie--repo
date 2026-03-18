export type MovieLanguage = "Hindi" | "Bangla" | "Telugu" | "English" | "Other";

export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  type: "movie" | "tv-show";
  category: "Trending" | "Action" | "Comedy" | "Horror" | "Romance" | "Documentaries";
  language: MovieLanguage;
  duration?: string;
  releaseDate?: string;
  isFeatured?: boolean;
  views?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: "user" | "admin";
  watchlist?: string[];
  likedMovies?: string[];
  isBlocked?: boolean;
}

export interface PreauthorizedAdmin {
  email: string;
  authorizedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
