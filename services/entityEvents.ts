export type EntityChannel =
  | 'journal'
  | 'agenda'
  | 'deliverable'
  | 'calendar'
  | 'pomodoro'
  | 'brand'
  | 'client'
  | 'people'
  | 'concept'
  | 'goal';

const EVENT_NAME = 'sylvia-entity-update';

export const emitEntityUpdate = (entity: EntityChannel) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { entity } }));
};

export const subscribeToEntityUpdates = (
  entities: EntityChannel[] | EntityChannel,
  handler: () => void,
): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const watched = Array.isArray(entities) ? entities : [entities];
  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ entity?: EntityChannel }>;
    const entity = custom.detail?.entity;
    if (!entity) return;
    if (watched.includes(entity)) {
      handler();
    }
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
};
