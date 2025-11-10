import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import {
  TwitterAccount,
  TwitterDraft,
  TwitterScheduledPost,
  TwitterAnalytics,
  TwitterList,
  TwitterHashtagTracker,
  TwitterMention,
  TwitterThread,
  TwitterMetrics
} from '../../types';
import { entityStorage } from '../../services/storage';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { useAppContext } from '../../context/AppContext';
import {
  Twitter,
  FileText,
  Calendar,
  BarChart3,
  List,
  Hash,
  Bell,
  MessageSquare,
  TrendingUp,
  Plus,
  Search,
  Settings,
  Clock,
  Send,
  Trash2,
  Edit3
} from 'lucide-react';

type TwitterTab = 'drafts' | 'scheduled' | 'analytics' | 'lists' | 'hashtags' | 'mentions' | 'threads' | 'metrics';

const TAB_CONFIG: Record<TwitterTab, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  drafts: { label: 'Drafts', Icon: FileText, color: 'text-blue-600' },
  scheduled: { label: 'Scheduled', Icon: Calendar, color: 'text-purple-600' },
  analytics: { label: 'Analytics', Icon: BarChart3, color: 'text-green-600' },
  lists: { label: 'Lists', Icon: List, color: 'text-orange-600' },
  hashtags: { label: 'Hashtags', Icon: Hash, color: 'text-pink-600' },
  mentions: { label: 'Mentions', Icon: Bell, color: 'text-red-600' },
  threads: { label: 'Threads', Icon: MessageSquare, color: 'text-indigo-600' },
  metrics: { label: 'Metrics', Icon: TrendingUp, color: 'text-teal-600' },
};

const TwitterPage: React.FC = () => {
  const { setEntityDetailView, setActiveEntity } = useAppContext();
  const [activeTab, setActiveTab] = useState<TwitterTab>('drafts');
  const [searchQuery, setSearchQuery] = useState('');

  // Twitter data state
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [drafts, setDrafts] = useState<TwitterDraft[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<TwitterScheduledPost[]>([]);
  const [analytics, setAnalytics] = useState<TwitterAnalytics[]>([]);
  const [lists, setLists] = useState<TwitterList[]>([]);
  const [hashtags, setHashtags] = useState<TwitterHashtagTracker[]>([]);
  const [mentions, setMentions] = useState<TwitterMention[]>([]);
  const [threads, setThreads] = useState<TwitterThread[]>([]);
  const [metrics, setMetrics] = useState<TwitterMetrics[]>([]);

  // Load functions
  const loadAccounts = useCallback(async () => {
    const data = await entityStorage.getTwitterAccounts();
    setAccounts(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadDrafts = useCallback(async () => {
    const data = await entityStorage.getTwitterDrafts();
    setDrafts(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadScheduledPosts = useCallback(async () => {
    const data = await entityStorage.getTwitterScheduledPosts();
    setScheduledPosts(data.sort((a, b) => a.scheduledAt - b.scheduledAt));
  }, []);

  const loadAnalytics = useCallback(async () => {
    const data = await entityStorage.getTwitterAnalytics();
    setAnalytics(data.sort((a, b) => b.fetchedAt - a.fetchedAt));
  }, []);

  const loadLists = useCallback(async () => {
    const data = await entityStorage.getTwitterLists();
    setLists(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadHashtags = useCallback(async () => {
    const data = await entityStorage.getTwitterHashtagTrackers();
    setHashtags(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadMentions = useCallback(async () => {
    const data = await entityStorage.getTwitterMentions();
    setMentions(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadThreads = useCallback(async () => {
    const data = await entityStorage.getTwitterThreads();
    setThreads(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadMetrics = useCallback(async () => {
    const data = await entityStorage.getTwitterMetrics();
    setMetrics(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useEffect(() => {
    loadAccounts();
    loadDrafts();
    loadScheduledPosts();
    loadAnalytics();
    loadLists();
    loadHashtags();
    loadMentions();
    loadThreads();
    loadMetrics();

    // Subscribe to updates
    const unsubscribers = [
      subscribeToEntityUpdates('twitterAccount', loadAccounts),
      subscribeToEntityUpdates('twitterDraft', loadDrafts),
      subscribeToEntityUpdates('twitterScheduled', loadScheduledPosts),
      subscribeToEntityUpdates('twitterAnalytics', loadAnalytics),
      subscribeToEntityUpdates('twitterList', loadLists),
      subscribeToEntityUpdates('twitterHashtag', loadHashtags),
      subscribeToEntityUpdates('twitterMention', loadMentions),
      subscribeToEntityUpdates('twitterThread', loadThreads),
      subscribeToEntityUpdates('twitterMetrics', loadMetrics),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [loadAccounts, loadDrafts, loadScheduledPosts, loadAnalytics, loadLists, loadHashtags, loadMentions, loadThreads, loadMetrics]);

  // Connected account info
  const connectedAccount = accounts.find(acc => acc.isConnected);

  // Stats
  const stats = useMemo(() => ({
    drafts: drafts.length,
    scheduled: scheduledPosts.filter(p => p.status === 'pending').length,
    analytics: analytics.length,
    lists: lists.length,
    hashtags: hashtags.filter(h => h.isActive).length,
    mentions: mentions.filter(m => !m.isRead).length,
    threads: threads.filter(t => t.status === 'draft').length,
    metrics: metrics.length,
  }), [drafts, scheduledPosts, analytics, lists, hashtags, mentions, threads, metrics]);

  // Render functions for each tab
  const renderDrafts = () => {
    const filteredDrafts = drafts.filter(draft =>
      draft.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="space-y-6">
        {filteredDrafts.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <FileText className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No drafts yet</h3>
            <p className="text-secondary-light">Ask Sylvia to create a tweet draft for you!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDrafts.map(draft => (
              <div
                key={draft.id}
                className="glass-panel rounded-3xl border border-white/70 p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setEntityDetailView({ type: 'twitterDraft', id: draft.id });
                  setActiveEntity({ type: 'twitterDraft', id: draft.id, data: draft });
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {draft.isThread && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                          Thread
                        </span>
                      )}
                      {draft.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {draft.content}
                    </p>
                    {draft.threadTweets && draft.threadTweets.length > 0 && (
                      <p className="text-sm text-secondary-light mt-2">
                        +{draft.threadTweets.length} more tweets in thread
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <span className="text-xs text-secondary-light">
                    {new Date(draft.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        entityStorage.deleteTwitterDraft(draft.id);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderScheduled = () => {
    const filteredScheduled = scheduledPosts.filter(post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {filteredScheduled.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <Calendar className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No scheduled posts</h3>
            <p className="text-secondary-light">Schedule tweets with Sylvia for automatic posting!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredScheduled.map(post => (
              <div
                key={post.id}
                className={`glass-panel rounded-3xl border p-6 hover:shadow-lg transition-all ${
                  post.status === 'posted'
                    ? 'border-green-200 bg-green-50'
                    : post.status === 'failed'
                    ? 'border-red-200 bg-red-50'
                    : 'border-white/70'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        post.status === 'posted'
                          ? 'bg-green-100 text-green-700'
                          : post.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : post.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {post.status}
                      </span>
                      {post.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-base leading-relaxed whitespace-pre-wrap mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-secondary-light">
                      <Clock className="w-4 h-4" />
                      <span>
                        Scheduled: {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {post.errorMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-100 border border-red-200 text-red-700 text-sm">
                    {post.errorMessage}
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <span className="text-xs text-secondary-light">
                    Created: {new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        {analytics.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No analytics data</h3>
            <p className="text-secondary-light">Tweet analytics will appear here once Sylvia fetches them!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {analytics.map(item => (
              <div
                key={item.id}
                className="glass-panel rounded-3xl border border-white/70 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium mb-2 block"
                    >
                      View Tweet →
                    </a>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.impressions?.toLocaleString() || 0}</div>
                        <div className="text-xs text-secondary-light uppercase tracking-wider">Impressions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.engagements?.toLocaleString() || 0}</div>
                        <div className="text-xs text-secondary-light uppercase tracking-wider">Engagements</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.likes?.toLocaleString() || 0}</div>
                        <div className="text-xs text-secondary-light uppercase tracking-wider">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{item.retweets?.toLocaleString() || 0}</div>
                        <div className="text-xs text-secondary-light uppercase tracking-wider">Retweets</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20 text-xs text-secondary-light">
                  Fetched: {new Date(item.fetchedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLists = () => {
    return (
      <div className="space-y-6">
        {lists.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <List className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Twitter lists</h3>
            <p className="text-secondary-light">Ask Sylvia to track your Twitter lists!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lists.map(list => (
              <div
                key={list.id}
                className="glass-panel rounded-3xl border border-white/70 p-6 hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-bold mb-2">{list.name}</h3>
                {list.description && (
                  <p className="text-sm text-secondary-light mb-4">{list.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-secondary-light">{list.memberCount} members</span>
                  <span className="text-secondary-light">{list.subscriberCount} subscribers</span>
                  {list.isPrivate && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      Private
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHashtags = () => {
    return (
      <div className="space-y-6">
        {hashtags.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <Hash className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tracked hashtags</h3>
            <p className="text-secondary-light">Ask Sylvia to track hashtags for you!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {hashtags.map(tracker => (
              <div
                key={tracker.id}
                className={`glass-panel rounded-3xl border p-6 hover:shadow-lg transition-all ${
                  tracker.isActive ? 'border-green-200 bg-green-50' : 'border-white/70'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold">#{tracker.hashtag}</h3>
                  {tracker.isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      Active
                    </span>
                  )}
                </div>
                {tracker.tweetCount !== undefined && (
                  <p className="text-2xl font-bold text-blue-600 mb-2">{tracker.tweetCount.toLocaleString()} tweets</p>
                )}
                {tracker.notes && (
                  <p className="text-sm text-secondary-light mb-4">{tracker.notes}</p>
                )}
                <div className="text-xs text-secondary-light">
                  Tracking since: {new Date(tracker.trackingStartedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMentions = () => {
    const unreadCount = mentions.filter(m => !m.isRead).length;

    return (
      <div className="space-y-6">
        {unreadCount > 0 && (
          <div className="glass-panel rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Bell className="w-5 h-5" />
              <span className="font-semibold">{unreadCount} unread mention{unreadCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
        {mentions.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <Bell className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No mentions</h3>
            <p className="text-secondary-light">Twitter mentions will appear here!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mentions.map(mention => (
              <div
                key={mention.id}
                className={`glass-panel rounded-3xl border p-6 hover:shadow-lg transition-all ${
                  !mention.isRead ? 'border-blue-200 bg-blue-50' : 'border-white/70'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">{mention.authorDisplayName}</span>
                      <span className="text-secondary-light text-sm">@{mention.authorUsername}</span>
                      {!mention.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-base leading-relaxed mb-2">{mention.content}</p>
                    {mention.permalink && (
                      <a
                        href={mention.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View on Twitter →
                      </a>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20 text-xs text-secondary-light">
                  {new Date(mention.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderThreads = () => {
    return (
      <div className="space-y-6">
        {threads.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No threads</h3>
            <p className="text-secondary-light">Ask Sylvia to create Twitter threads for you!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {threads.map(thread => (
              <div
                key={thread.id}
                className="glass-panel rounded-3xl border border-white/70 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {thread.title && (
                      <h3 className="text-xl font-bold mb-3">{thread.title}</h3>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        thread.status === 'posted'
                          ? 'bg-green-100 text-green-700'
                          : thread.status === 'scheduled'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {thread.status}
                      </span>
                      <span className="text-sm text-secondary-light">
                        {thread.tweets.length} tweet{thread.tweets.length !== 1 ? 's' : ''}
                      </span>
                      {thread.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {thread.tweets.slice(0, 2).map((tweet, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-white/50 border border-white/70">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-secondary-light">{idx + 1}.</span>
                            <p className="text-sm flex-1">{tweet.content}</p>
                          </div>
                        </div>
                      ))}
                      {thread.tweets.length > 2 && (
                        <p className="text-sm text-secondary-light text-center">
                          +{thread.tweets.length - 2} more tweets
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20 text-xs text-secondary-light">
                  Created: {new Date(thread.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMetrics = () => {
    return (
      <div className="space-y-6">
        {metrics.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <TrendingUp className="w-16 h-16 text-secondary-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No metrics data</h3>
            <p className="text-secondary-light">Daily Twitter metrics will appear here!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {metrics.map(metric => (
              <div
                key={metric.id}
                className="glass-panel rounded-3xl border border-white/70 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{metric.date}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-2xl bg-blue-50">
                    <div className="text-2xl font-bold text-blue-600">{metric.followers.toLocaleString()}</div>
                    <div className="text-xs text-secondary-light uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-purple-50">
                    <div className="text-2xl font-bold text-purple-600">{metric.following.toLocaleString()}</div>
                    <div className="text-xs text-secondary-light uppercase tracking-wider">Following</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-green-50">
                    <div className="text-2xl font-bold text-green-600">{metric.totalTweets.toLocaleString()}</div>
                    <div className="text-xs text-secondary-light uppercase tracking-wider">Total Tweets</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-orange-50">
                    <div className="text-2xl font-bold text-orange-600">
                      {metric.totalImpressions?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-xs text-secondary-light uppercase tracking-wider">Impressions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'drafts':
        return renderDrafts();
      case 'scheduled':
        return renderScheduled();
      case 'analytics':
        return renderAnalytics();
      case 'lists':
        return renderLists();
      case 'hashtags':
        return renderHashtags();
      case 'mentions':
        return renderMentions();
      case 'threads':
        return renderThreads();
      case 'metrics':
        return renderMetrics();
      default:
        return null;
    }
  };

  return (
    <PageShell
      title="Twitter/X Integration"
      subtitle="Manage your Twitter presence with Sylvia. Create drafts, schedule posts, track analytics, and more."
    >
      {/* Account Connection Status */}
      <div className="mb-6">
        <div className={`glass-panel rounded-2xl border p-4 ${
          connectedAccount ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Twitter className={`w-6 h-6 ${connectedAccount ? 'text-green-600' : 'text-orange-600'}`} />
              <div>
                {connectedAccount ? (
                  <>
                    <div className="font-semibold text-green-900">Connected: @{connectedAccount.username}</div>
                    <div className="text-sm text-green-700">{connectedAccount.displayName}</div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-orange-900">No Twitter account connected</div>
                    <div className="text-sm text-orange-700">Ask Sylvia to connect your Twitter account</div>
                  </>
                )}
              </div>
            </div>
            {connectedAccount && (
              <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="glass-panel rounded-2xl border border-white/70 p-2">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {Object.entries(TAB_CONFIG).map(([key, config]) => {
              const tab = key as TwitterTab;
              const count = stats[tab];
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(tab)}
                  className={`relative rounded-xl px-3 py-2 transition-all ${
                    activeTab === tab
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-white/80 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <config.Icon className={`w-5 h-5 ${activeTab === tab ? 'text-white' : config.color}`} />
                    <span className="text-xs font-medium">{config.label}</span>
                    {count > 0 && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                        activeTab === tab ? 'bg-white text-black' : 'bg-black text-white'
                      }`}>
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar (for applicable tabs) */}
      {(activeTab === 'drafts' || activeTab === 'scheduled') && (
        <div className="mb-6">
          <div className="glass-panel rounded-2xl border border-white/70 p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-secondary-light" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="flex-1 bg-transparent outline-none text-lg placeholder:text-secondary-light"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 rounded-full bg-white/80 border border-white/70 text-sm hover:bg-white transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      {renderActiveTab()}
    </PageShell>
  );
};

export default TwitterPage;
