export const getGAId = () =>
  typeof window !== 'undefined' ? (window as any).GA_TRACKING_ID : undefined;

export const pageview = (url: string) => {
  const gaId = getGAId();
  if (typeof window !== 'undefined' && (window as any).gtag && gaId) {
    (window as any).gtag('config', gaId, {
      page_path: url,
    });
  }
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific event helpers
export const trackEnrollNow = (courseTitle: string) => {
  event({
    action: 'enroll_now_click',
    category: 'engagement',
    label: courseTitle,
  });
};

export const trackQuizStart = (quizTitle: string) => {
  event({
    action: 'quiz_start',
    category: 'quiz',
    label: quizTitle,
  });
};

export const trackQuizFinish = (quizTitle: string, score: number) => {
  event({
    action: 'quiz_finish',
    category: 'quiz',
    label: quizTitle,
    value: score,
  });
};

export const trackListenWatch = (
  unitTitle: string,
  type: 'listen' | 'watch',
) => {
  event({
    action: `${type}_click`,
    category: 'engagement',
    label: unitTitle,
  });
};

export const trackAskAI = (unitTitle: string, query?: string) => {
  event({
    action: 'ask_ai_click',
    category: 'ai',
    label: unitTitle,
    value: query ? 1 : 0,
  });
};
