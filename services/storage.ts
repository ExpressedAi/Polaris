
import { Message, Thread, JITSnippet, JournalEntry, AgendaItem, CalendarEvent, PomodoroSession, BrandRecord, ClientRecord, PeopleRecord, ConceptRecord, XPEvent, Deliverable, AgendaSession, PostMortem, GoalRecord, VendorTask, TwitterAccount, TwitterDraft, TwitterScheduledPost, TwitterAnalytics, TwitterList, TwitterDM, TwitterHashtagTracker, TwitterMention, TwitterThread, TwitterMetrics } from '../types';

const DB_NAME = 'ChatPlatformDB';
const DB_VERSION = 7; // Incremented for Twitter stores
const THREADS_STORE = 'threads';
const MESSAGES_STORE = 'messages';
const SETTINGS_STORE = 'settings';
const JIT_STORE = 'jit_snippets';
const JOURNAL_STORE = 'journal_entries';
const AGENDA_STORE = 'agenda_items';
const CALENDAR_STORE = 'calendar_events';
const POMODORO_STORE = 'pomodoro_sessions';
const BRAND_STORE = 'brand_records';
const CLIENT_STORE = 'client_records';
const PEOPLE_STORE = 'people_records';
const CONCEPT_STORE = 'concept_records';
const XP_STORE = 'xp_events';
const DELIVERABLE_STORE = 'deliverables';
const SESSION_STORE = 'agenda_sessions';
const POST_MORTEM_STORE = 'post_mortems';
const GOAL_STORE = 'goal_records';
const VENDOR_TASK_STORE = 'vendor_tasks';
const TWITTER_ACCOUNT_STORE = 'twitter_accounts';
const TWITTER_DRAFT_STORE = 'twitter_drafts';
const TWITTER_SCHEDULED_STORE = 'twitter_scheduled_posts';
const TWITTER_ANALYTICS_STORE = 'twitter_analytics';
const TWITTER_LIST_STORE = 'twitter_lists';
const TWITTER_DM_STORE = 'twitter_dms';
const TWITTER_HASHTAG_STORE = 'twitter_hashtag_trackers';
const TWITTER_MENTION_STORE = 'twitter_mentions';
const TWITTER_THREAD_STORE = 'twitter_threads';
const TWITTER_METRICS_STORE = 'twitter_metrics';

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create threads store
      if (!database.objectStoreNames.contains(THREADS_STORE)) {
        const threadsStore = database.createObjectStore(THREADS_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
        threadsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Create messages store
      if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = database.createObjectStore(MESSAGES_STORE, {
          keyPath: 'id',
          autoIncrement: false,
        });
        messagesStore.createIndex('threadId', 'threadId', { unique: false });
        messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, {
          keyPath: 'key',
        });
      }

      const ensureStore = (name: string, options?: IDBObjectStoreParameters) => {
        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name, options || { keyPath: 'id' });
        }
      };

      ensureStore(JIT_STORE);
      ensureStore(JOURNAL_STORE);
      ensureStore(AGENDA_STORE);
      ensureStore(CALENDAR_STORE);
      ensureStore(POMODORO_STORE);
      ensureStore(BRAND_STORE);
      ensureStore(CLIENT_STORE);
      ensureStore(PEOPLE_STORE);
      ensureStore(CONCEPT_STORE);
      ensureStore(XP_STORE);
      ensureStore(DELIVERABLE_STORE);
      ensureStore(SESSION_STORE);
      ensureStore(POST_MORTEM_STORE);
      ensureStore(GOAL_STORE);
      ensureStore(VENDOR_TASK_STORE);
      ensureStore(TWITTER_ACCOUNT_STORE);
      ensureStore(TWITTER_DRAFT_STORE);
      ensureStore(TWITTER_SCHEDULED_STORE);
      ensureStore(TWITTER_ANALYTICS_STORE);
      ensureStore(TWITTER_LIST_STORE);
      ensureStore(TWITTER_DM_STORE);
      ensureStore(TWITTER_HASHTAG_STORE);
      ensureStore(TWITTER_MENTION_STORE);
      ensureStore(TWITTER_THREAD_STORE);
      ensureStore(TWITTER_METRICS_STORE);
    };
  });
}

// Thread operations
export async function saveThread(thread: Thread): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([THREADS_STORE], 'readwrite');
    const store = transaction.objectStore(THREADS_STORE);
    const request = store.put(thread);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([THREADS_STORE], 'readonly');
    const store = transaction.objectStore(THREADS_STORE);
    const request = store.get(threadId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllThreads(): Promise<Thread[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([THREADS_STORE], 'readonly');
    const store = transaction.objectStore(THREADS_STORE);
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev'); // Sort by updatedAt descending
    
    const threads: Thread[] = [];
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        threads.push(cursor.value);
        cursor.continue();
      } else {
        resolve(threads);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteThread(threadId: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([THREADS_STORE, MESSAGES_STORE], 'readwrite');
    
    // Delete thread
    const threadsStore = transaction.objectStore(THREADS_STORE);
    const deleteThreadRequest = threadsStore.delete(threadId);
    
    // Delete all messages for this thread
    const messagesStore = transaction.objectStore(MESSAGES_STORE);
    const messagesIndex = messagesStore.index('threadId');
    const messagesRequest = messagesIndex.openCursor(IDBKeyRange.only(threadId));
    
    messagesRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    deleteThreadRequest.onsuccess = () => resolve();
    deleteThreadRequest.onerror = () => reject(deleteThreadRequest.error);
    messagesRequest.onerror = () => reject(messagesRequest.error);
  });
}

// Message operations
export async function saveMessage(message: Message): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MESSAGES_STORE], 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    const request = store.put(message);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesForThread(threadId: string): Promise<Message[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MESSAGES_STORE], 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('threadId');
    const request = index.getAll(threadId);
    
    request.onsuccess = () => {
      const messages = request.result || [];
      // Sort by createdAt ascending
      messages.sort((a, b) => a.createdAt - b.createdAt);
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
}

// Settings operations
export async function saveSetting(key: string, value: any): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : defaultValue);
    };
    request.onerror = () => reject(request.error);
  });
}

// ---------- JIT Memory ----------

export async function saveJITSnippet(snippet: JITSnippet): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([JIT_STORE], 'readwrite');
    const store = tx.objectStore(JIT_STORE);
    const request = store.put(snippet);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSnippetsByTags(tags: string[], limit = 10): Promise<JITSnippet[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([JIT_STORE], 'readonly');
    const store = tx.objectStore(JIT_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = (request.result as JITSnippet[]) || [];
      const filtered = all
        .map(snippet => {
          const overlap = snippet.tags.filter(tag => tags.includes(tag));
          const relevance = overlap.length / Math.max(snippet.tags.length, 1);
          return { snippet, relevance: snippet.relevance + relevance };
        })
        .filter(item => item.relevance > 0);
      filtered.sort((a, b) => b.relevance - a.relevance);
      resolve(filtered.slice(0, limit).map(item => item.snippet));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getRecentSnippets(limit = 5): Promise<JITSnippet[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([JIT_STORE], 'readonly');
    const store = tx.objectStore(JIT_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = (request.result as JITSnippet[]) || [];
      const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
      resolve(sorted.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ---------- Generic entity helpers ----------

type EntityRecord = JournalEntry | AgendaItem | CalendarEvent | PomodoroSession | BrandRecord | ClientRecord | PeopleRecord | ConceptRecord | Deliverable | AgendaSession | PostMortem | GoalRecord | VendorTask | TwitterAccount | TwitterDraft | TwitterScheduledPost | TwitterAnalytics | TwitterList | TwitterDM | TwitterHashtagTracker | TwitterMention | TwitterThread | TwitterMetrics;

const storeMap: Record<string, string> = {
  journal: JOURNAL_STORE,
  agenda: AGENDA_STORE,
  calendar: CALENDAR_STORE,
  pomodoro: POMODORO_STORE,
  brand: BRAND_STORE,
  client: CLIENT_STORE,
  people: PEOPLE_STORE,
  concept: CONCEPT_STORE,
  deliverable: DELIVERABLE_STORE,
  session: SESSION_STORE,
  postMortem: POST_MORTEM_STORE,
  goal: GOAL_STORE,
  vendorTask: VENDOR_TASK_STORE,
  twitterAccount: TWITTER_ACCOUNT_STORE,
  twitterDraft: TWITTER_DRAFT_STORE,
  twitterScheduled: TWITTER_SCHEDULED_STORE,
  twitterAnalytics: TWITTER_ANALYTICS_STORE,
  twitterList: TWITTER_LIST_STORE,
  twitterDM: TWITTER_DM_STORE,
  twitterHashtag: TWITTER_HASHTAG_STORE,
  twitterMention: TWITTER_MENTION_STORE,
  twitterThread: TWITTER_THREAD_STORE,
  twitterMetrics: TWITTER_METRICS_STORE,
};

async function saveRecord(storeName: string, record: EntityRecord): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteRecord(storeName: string, id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAllRecords<T>(storeName: string): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as T[]) || []);
    request.onerror = () => reject(request.error);
  });
}

async function clearStore(storeName: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const entityStorage = {
  saveJournalEntry: (entry: JournalEntry) => saveRecord(storeMap.journal, entry),
  getJournalEntries: () => getAllRecords<JournalEntry>(storeMap.journal),
  deleteJournalEntry: (id: string) => deleteRecord(storeMap.journal, id),
  saveAgendaItem: (item: AgendaItem) => saveRecord(storeMap.agenda, item),
  getAgendaItems: () => getAllRecords<AgendaItem>(storeMap.agenda),
  deleteAgendaItem: (id: string) => deleteRecord(storeMap.agenda, id),
  saveCalendarEvent: (event: CalendarEvent) => saveRecord(storeMap.calendar, event),
  getCalendarEvents: () => getAllRecords<CalendarEvent>(storeMap.calendar),
  deleteCalendarEvent: (id: string) => deleteRecord(storeMap.calendar, id),
  savePomodoroSession: (session: PomodoroSession) => saveRecord(storeMap.pomodoro, session),
  getPomodoroSessions: () => getAllRecords<PomodoroSession>(storeMap.pomodoro),
  deletePomodoroSession: (id: string) => deleteRecord(storeMap.pomodoro, id),
  saveBrandRecord: (record: BrandRecord) => saveRecord(storeMap.brand, record),
  getBrandRecords: () => getAllRecords<BrandRecord>(storeMap.brand),
  deleteBrandRecord: (id: string) => deleteRecord(storeMap.brand, id),
  saveClientRecord: (record: ClientRecord) => saveRecord(storeMap.client, record),
  getClientRecords: () => getAllRecords<ClientRecord>(storeMap.client),
  deleteClientRecord: (id: string) => deleteRecord(storeMap.client, id),
  savePeopleRecord: (record: PeopleRecord) => saveRecord(storeMap.people, record),
  getPeopleRecords: () => getAllRecords<PeopleRecord>(storeMap.people),
  deletePeopleRecord: (id: string) => deleteRecord(storeMap.people, id),
  saveConceptRecord: (record: ConceptRecord) => saveRecord(storeMap.concept, record),
  getConceptRecords: () => getAllRecords<ConceptRecord>(storeMap.concept),
  deleteConceptRecord: (id: string) => deleteRecord(storeMap.concept, id),
  saveDeliverable: (record: Deliverable) => saveRecord(DELIVERABLE_STORE, record),
  getDeliverables: () => getAllRecords<Deliverable>(DELIVERABLE_STORE),
  deleteDeliverable: (id: string) => deleteRecord(DELIVERABLE_STORE, id),
  saveAgendaSession: (session: AgendaSession) => saveRecord(SESSION_STORE, session),
  getAgendaSessions: () => getAllRecords<AgendaSession>(SESSION_STORE),
  deleteAgendaSession: (id: string) => deleteRecord(SESSION_STORE, id),
  savePostMortem: (mortem: PostMortem) => saveRecord(POST_MORTEM_STORE, mortem),
  getPostMortems: () => getAllRecords<PostMortem>(POST_MORTEM_STORE),
  deletePostMortem: (id: string) => deleteRecord(POST_MORTEM_STORE, id),
  saveGoal: (goal: GoalRecord) => saveRecord(GOAL_STORE, goal),
  getGoals: () => getAllRecords<GoalRecord>(GOAL_STORE),
  deleteGoal: (id: string) => deleteRecord(GOAL_STORE, id),
  saveVendorTask: (task: VendorTask) => saveRecord(VENDOR_TASK_STORE, task),
  getVendorTasks: () => getAllRecords<VendorTask>(VENDOR_TASK_STORE),
  deleteVendorTask: (id: string) => deleteRecord(VENDOR_TASK_STORE, id),
  // Twitter storage methods
  saveTwitterAccount: (account: TwitterAccount) => saveRecord(TWITTER_ACCOUNT_STORE, account),
  getTwitterAccounts: () => getAllRecords<TwitterAccount>(TWITTER_ACCOUNT_STORE),
  deleteTwitterAccount: (id: string) => deleteRecord(TWITTER_ACCOUNT_STORE, id),
  saveTwitterDraft: (draft: TwitterDraft) => saveRecord(TWITTER_DRAFT_STORE, draft),
  getTwitterDrafts: () => getAllRecords<TwitterDraft>(TWITTER_DRAFT_STORE),
  deleteTwitterDraft: (id: string) => deleteRecord(TWITTER_DRAFT_STORE, id),
  saveTwitterScheduledPost: (post: TwitterScheduledPost) => saveRecord(TWITTER_SCHEDULED_STORE, post),
  getTwitterScheduledPosts: () => getAllRecords<TwitterScheduledPost>(TWITTER_SCHEDULED_STORE),
  deleteTwitterScheduledPost: (id: string) => deleteRecord(TWITTER_SCHEDULED_STORE, id),
  saveTwitterAnalytics: (analytics: TwitterAnalytics) => saveRecord(TWITTER_ANALYTICS_STORE, analytics),
  getTwitterAnalytics: () => getAllRecords<TwitterAnalytics>(TWITTER_ANALYTICS_STORE),
  deleteTwitterAnalytics: (id: string) => deleteRecord(TWITTER_ANALYTICS_STORE, id),
  saveTwitterList: (list: TwitterList) => saveRecord(TWITTER_LIST_STORE, list),
  getTwitterLists: () => getAllRecords<TwitterList>(TWITTER_LIST_STORE),
  deleteTwitterList: (id: string) => deleteRecord(TWITTER_LIST_STORE, id),
  saveTwitterDM: (dm: TwitterDM) => saveRecord(TWITTER_DM_STORE, dm),
  getTwitterDMs: () => getAllRecords<TwitterDM>(TWITTER_DM_STORE),
  deleteTwitterDM: (id: string) => deleteRecord(TWITTER_DM_STORE, id),
  saveTwitterHashtagTracker: (tracker: TwitterHashtagTracker) => saveRecord(TWITTER_HASHTAG_STORE, tracker),
  getTwitterHashtagTrackers: () => getAllRecords<TwitterHashtagTracker>(TWITTER_HASHTAG_STORE),
  deleteTwitterHashtagTracker: (id: string) => deleteRecord(TWITTER_HASHTAG_STORE, id),
  saveTwitterMention: (mention: TwitterMention) => saveRecord(TWITTER_MENTION_STORE, mention),
  getTwitterMentions: () => getAllRecords<TwitterMention>(TWITTER_MENTION_STORE),
  deleteTwitterMention: (id: string) => deleteRecord(TWITTER_MENTION_STORE, id),
  saveTwitterThread: (thread: TwitterThread) => saveRecord(TWITTER_THREAD_STORE, thread),
  getTwitterThreads: () => getAllRecords<TwitterThread>(TWITTER_THREAD_STORE),
  deleteTwitterThread: (id: string) => deleteRecord(TWITTER_THREAD_STORE, id),
  saveTwitterMetrics: (metrics: TwitterMetrics) => saveRecord(TWITTER_METRICS_STORE, metrics),
  getTwitterMetrics: () => getAllRecords<TwitterMetrics>(TWITTER_METRICS_STORE),
  deleteTwitterMetrics: (id: string) => deleteRecord(TWITTER_METRICS_STORE, id),
};

/**
 * Clear all data from the database (except settings by default)
 * @param includeSettings If true, also clears all settings
 */
export async function clearAllData(includeSettings: boolean = false): Promise<void> {
  const storesToClear = [
    THREADS_STORE,
    MESSAGES_STORE,
    JIT_STORE,
    JOURNAL_STORE,
    AGENDA_STORE,
    CALENDAR_STORE,
    POMODORO_STORE,
    BRAND_STORE,
    CLIENT_STORE,
    PEOPLE_STORE,
    CONCEPT_STORE,
    XP_STORE,
    DELIVERABLE_STORE,
    SESSION_STORE,
    POST_MORTEM_STORE,
    GOAL_STORE,
    VENDOR_TASK_STORE,
    TWITTER_ACCOUNT_STORE,
    TWITTER_DRAFT_STORE,
    TWITTER_SCHEDULED_STORE,
    TWITTER_ANALYTICS_STORE,
    TWITTER_LIST_STORE,
    TWITTER_DM_STORE,
    TWITTER_HASHTAG_STORE,
    TWITTER_MENTION_STORE,
    TWITTER_THREAD_STORE,
    TWITTER_METRICS_STORE,
  ];

  if (includeSettings) {
    storesToClear.push(SETTINGS_STORE);
  }

  // Clear all stores in parallel
  await Promise.all(storesToClear.map(store => clearStore(store)));
}

// ---------- XP events ----------

export async function logXpEvent(event: XPEvent): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([XP_STORE], 'readwrite');
    const store = tx.objectStore(XP_STORE);
    const request = store.put(event);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getXpEvents(limit = 20): Promise<XPEvent[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([XP_STORE], 'readonly');
    const store = tx.objectStore(XP_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const records = (request.result as XPEvent[]) || [];
      resolve(records.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}
