export type WriteSurfaceConfig = {
  id: string;
  label: string;
  onRequest: (prompt: string) => void;
};

const surfaces = new Map<string, WriteSurfaceConfig>();

export const registerWriteSurface = (config: WriteSurfaceConfig): (() => void) => {
  surfaces.set(config.id, config);
  return () => surfaces.delete(config.id);
};

export const requestWriteSurface = (surfaceId: string, prompt: string) => {
  const surface = surfaces.get(surfaceId);
  if (surface) {
    surface.onRequest(prompt);
  } else {
    console.warn(`No write surface registered for ${surfaceId}`);
  }
};

export const listWriteSurfaces = () => Array.from(surfaces.values());
