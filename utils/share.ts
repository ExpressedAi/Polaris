export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export const canShare = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

export const share = async (data: ShareData): Promise<{ success: boolean; error?: string }> => {
  if (!canShare()) {
    return {
      success: false,
      error: 'Web Share API is not supported in this browser',
    };
  }

  try {
    await navigator.share(data);
    return { success: true };
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Share cancelled' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Share failed',
    };
  }
};

export const shareText = (text: string, title?: string) => {
  return share({ text, title });
};

export const shareURL = (url: string, title?: string, text?: string) => {
  return share({ url, title, text });
};

// Fallback for browsers that don't support Web Share API
export const copyShareLink = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
