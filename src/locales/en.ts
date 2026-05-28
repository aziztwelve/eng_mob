/**
 * English translations. Same key structure as ru.ts.
 */
const en = {
  onboarding: {
    common: {
      continue: 'Continue',
      back: 'Back',
      saving: 'Saving…',
      proceed: 'Continue',
      got_it: 'Got it',
      done: 'Done',
      step_progress: 'Step {{step}} of {{total}}',
    },

    welcome: {
      brand: 'LingoLearn',
      greeting_title: 'Hi! Ready to start?',
      greeting_subtitle: 'Learn languages with Lumi.',
      features: {
        speaking: 'Speaking',
        writing: 'Writing',
        vocab: 'Vocab',
        ai_lessons: 'AI-lessons',
      },
      section_title: 'Which language?',
      cta: 'Start learning',
      cta_submitting: 'Saving…',
      signin_link: 'I already have an account. Sign in →',
      tagline: 'Learn English in just 5 minutes a day with Lumi.',
      legal_prefix: 'By continuing, you agree to the',
      legal_and: 'and',
      terms_link: 'Terms of Service',
      privacy_link: 'Privacy Policy',
      terms_modal_title: 'Terms of Service',
      terms_modal_body:
        'Last updated: January 1, 2026.\n\n' +
        '1. Acceptance\nBy using the LingoLearn application (the "Service"), you confirm that you have read, understood, and agree to these Terms. If you do not agree, please stop using the Service.\n\n' +
        '2. Eligibility\nThe Service is available to users aged 13 and over. Users under 18 must have permission from a legal guardian.\n\n' +
        '3. Account\nYou may use the Service as a guest or create an account via email or OAuth (Google/Apple). You are responsible for keeping your password safe and for all activity on your account. Notify us of any unauthorized access.\n\n' +
        '4. License\nWe grant you a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial language learning.\n\n' +
        '5. Prohibited conduct\nYou may not: (a) copy, modify, decompile or reverse-engineer the Service; (b) use it for unlawful purposes; (c) scrape content automatically; (d) upload malicious code; (e) impersonate other users.\n\n' +
        '6. User content\nIf you upload text, audio or other content (e.g. AI chat, Writing exercises), you grant us a non-exclusive right to use it to operate and improve the Service. You confirm you have the rights to do so.\n\n' +
        '7. Purchases and subscriptions\nPaid subscriptions are processed via App Store or Google Play. Cancellation and refund terms follow the rules of the respective store.\n\n' +
        '8. Termination\nWe may suspend or terminate your account if you violate these Terms. You can delete your account at any time via Settings.\n\n' +
        '9. Disclaimer\nThe Service is provided "as is" without express or implied warranties. We do not guarantee that learning outcomes will meet your expectations.\n\n' +
        '10. Limitation of liability\nTo the maximum extent permitted by law, we are not liable for indirect, incidental, or punitive damages arising from your use of the Service.\n\n' +
        '11. Changes\nWe may update these Terms. We will notify you of material changes through the app. Continued use means you accept the updated Terms.\n\n' +
        '12. Contact\nQuestions: support@lingolearn.app',
      privacy_modal_title: 'Privacy Policy',
      privacy_modal_body:
        'Last updated: January 1, 2026.\n\n' +
        '1. Data we collect\n• Account: email, username, avatar (if you sign up via OAuth — name and email from the provider).\n• Learning progress: completed lessons, XP, streak, level, exercise answers.\n• Technical data: device type, OS, language, device ID, app version, interaction analytics.\n• Content: text and audio you send to AI features (chat, writing, pronunciation).\n• Push tokens: if you enable notifications.\n\n' +
        '2. How we use it\n• To provide and improve the Service (sync progress, personalized recommendations).\n• To run AI features (we forward request content to our AI providers — e.g. OpenAI).\n• To send push notifications for reminders, streaks, and achievements.\n• Security and abuse prevention.\n• Aggregated analytics to improve the product.\n\n' +
        '3. Sharing with third parties\nWe share data only with processors required to run the Service: cloud hosting, analytics (anonymized), AI API providers, push services (Expo/FCM/APNs), App Store / Google Play (for billing). We do not sell your data.\n\n' +
        '4. Data retention\nWe keep data while your account is active. After account deletion, learning data is removed within 30 days; anonymized analytics may be kept longer.\n\n' +
        '5. Your rights\nYou can: request a copy of your data, correct inaccuracies, delete your account, withdraw push notification consent, export your progress. Contact privacy@lingolearn.app.\n\n' +
        '6. Children\nThe Service is not intended for children under 13. We do not knowingly collect their data. Parents who discover such data — please contact us for removal.\n\n' +
        '7. Security\nWe use encryption (HTTPS/TLS) in transit and standard back-end security practices. However, no system can guarantee 100% security.\n\n' +
        '8. International transfers\nOur servers may be located in different countries. By using the Service you consent to data transfers to those jurisdictions with appropriate safeguards.\n\n' +
        '9. Changes\nWe will notify you of material changes through the app or by email.\n\n' +
        '10. Contact\nPrivacy questions: privacy@lingolearn.app',
    },

    goal: {
      title: 'Why are you learning?',
      subtitle: 'Pick your main goal — we’ll tailor the lessons.',
      options: {
        work:       { title: 'Work & career',     subtitle: 'Meetings, messages, growth' },
        exam:       { title: 'Exam',              subtitle: 'IELTS / TOEFL / DELF' },
        travel:     { title: 'Travel',            subtitle: 'Speak freely anywhere' },
        relocation: { title: 'Moving abroad',     subtitle: 'Live and work in a new country' },
        study:      { title: 'School & studies',  subtitle: 'School, university, courses' },
        social:     { title: 'Friends & people',  subtitle: 'Meet new people, stay in touch' },
        content:    { title: 'Movies & books',    subtitle: 'Watch without subs, read originals' },
        fun:        { title: 'Just for fun',      subtitle: 'Just curious' },
        brain:      { title: 'Brain training',    subtitle: 'Keep your mind sharp' },
      },
    },

    age: {
      title: 'How old are you?',
      subtitle: 'Helps us pick the right pace and tone.',
      options: {
        '7-12':  { title: '7–12 yrs',  subtitle: 'School, playful' },
        '13-17': { title: '13–17 yrs', subtitle: 'Teen' },
        '18-24': { title: '18–24',     subtitle: 'Student / early career' },
        '25-34': { title: '25–34',     subtitle: 'Professional growth' },
        '35-44': { title: '35–44',     subtitle: 'Experienced pro' },
        '45-54': { title: '45–54',     subtitle: 'New opportunities' },
        '55+':   { title: '55+',       subtitle: 'It’s never too late to learn' },
      },
    },

    level: {
      title: 'What’s your level?',
      subtitle: 'Not sure? Take the mini-test and we’ll figure it out.',
      options: {
        beginner:        { title: 'From scratch',         subtitle: 'Just starting' },
        a1:              { title: 'A1',                   subtitle: 'I know basic words' },
        a2:              { title: 'A2',                   subtitle: 'I can form a phrase' },
        b1:              { title: 'B1',                   subtitle: 'Fluent on everyday topics' },
        b2:              { title: 'B2',                   subtitle: 'I understand complex texts' },
        just_for_fun:    { title: 'Just for fun',         subtitle: 'No goals, no exams' },
        placement_test:  { title: 'Take a mini-test',     subtitle: 'We’ll pick for you' },
      },
    },

    daily_commit: {
      title: 'How many minutes a day?',
      subtitle: 'Small daily doses — the best recipe.',
      options: {
        '5':  { title: '5 minutes',  subtitle: 'Casual — easy pace' },
        '10': { title: '10 minutes', subtitle: 'Regular — recommended' },
        '15': { title: '15 minutes', subtitle: 'Serious — quick progress' },
        '25': { title: '25 minutes', subtitle: 'Intense — for the obsessed' },
      },
    },

    pain_points: {
      title: 'What’s holding you back the most?',
      subtitle: 'One main block — we’ll focus on it first.',
      options: {
        fear_speaking: { title: 'Fear of speaking',  subtitle: 'I freeze when I need to say it out loud' },
        lack_vocab:    { title: 'Not enough words',  subtitle: 'I know too few to express myself' },
        listening:     { title: 'Listening',         subtitle: 'Natives speak too fast' },
        grammar:       { title: 'Grammar',           subtitle: 'Tenses and rules get me confused' },
        consistency:   { title: 'Consistency',       subtitle: 'I start, drop, and start over' },
      },
    },

    speaking_situation: {
      title: 'When you need to speak out loud — what happens?',
      subtitle: 'Be honest — we need to know what to tune.',
      options: {
        freeze:             { title: 'I freeze',           subtitle: 'I pause and don’t know how to start' },
        translate_in_head:  { title: 'I translate in head', subtitle: 'First in my native, then to target' },
        too_short:          { title: 'I answer briefly',    subtitle: 'I want more but can’t' },
        avoid:              { title: 'I avoid speaking',    subtitle: 'I try to keep it minimal' },
      },
    },

    past_blocker: {
      title: 'What stopped you last time?',
      subtitle: 'Let’s avoid those same traps.',
      options: {
        boring:      { title: 'It got boring',   subtitle: 'Repetitive exercises' },
        too_hard:    { title: 'Too hard',        subtitle: 'Pace too high' },
        no_progress: { title: 'No progress',     subtitle: 'I studied but felt no result' },
        no_fit:      { title: 'Didn’t click',    subtitle: 'Topics didn’t resonate' },
        no_support:  { title: 'No support',      subtitle: 'Quit — no one to remind me' },
      },
    },

    future_regret: {
      title: 'What happens if nothing changes?',
      subtitle: 'Tough but honest — this fuels motivation.',
      options: {
        stay_same:  { title: 'Stay in the same place', subtitle: 'A year later — nothing changes' },
        limit_self: { title: 'Miss opportunities',     subtitle: 'Closed doors because of language' },
        pressure:   { title: 'Feel the pressure',      subtitle: 'Beating yourself up every day' },
        postpone:   { title: 'Postpone again',         subtitle: 'Another “I’ll start Monday”' },
      },
    },

    emotional_reaction: {
      title: 'When something goes wrong — how do you feel?',
      subtitle: 'Helps us pick the right tone.',
      options: {
        lose_confidence: { title: 'Lose confidence', subtitle: 'One mistake and I give up' },
        upset:           { title: 'Get upset',       subtitle: 'Hard things ruin my mood' },
        burnout:         { title: 'Burn out',        subtitle: 'Too much — I quit everything' },
        lost:            { title: 'Feel lost',       subtitle: 'I don’t know where to go next' },
      },
    },

    reminder_time: {
      title: 'When is the best time to study?',
      subtitle: 'We’ll pick reminder times that fit your rhythm.',
      options: {
        morning: { title: 'Morning',     subtitle: '07:00 — 11:00' },
        day:     { title: 'Daytime',     subtitle: '12:00 — 17:00' },
        evening: { title: 'Evening',     subtitle: '18:00 — 22:00' },
        flex:    { title: 'No fixed time', subtitle: 'I’ll open it when it’s convenient' },
      },
    },

    trust: {
      title: 'You already know more than you think.',
      subtitle: 'The trick isn’t starting over — it’s waking up and reinforcing.',
      continue_label: 'Got it',
      points: {
        knowledge: 'The words you already know haven’t gone anywhere.',
        listening: 'Familiarity with target sounds builds up — even from movies.',
        practice:  'Every attempt is already a skill. It just needs waking up.',
      },
    },

    building: {
      title: 'Combining your answers into one path.',
      subtitle: 'Every choice you made turns into a personal plan.',
      stat_a_number: '400K+',
      stat_a_label: 'learners launched\nnew languages',
      stat_b_number: '20K+',
      stat_b_label: '4.7+ ratings\non the App Store',
    },

    projection_chart: {
      legend_lumi: 'Lumi',
      legend_other: 'Other methods',
      label_start: 'Start',
      label_2w: '2 wks',
      label_1m: '1 mo',
      label_3m: '3 mo',
    },

    stacked_chart: {
      label_1w: '1 wk',
      label_1m: '1 mo',
      label_3m: '3 mo',
      cat_speaking: 'Speaking',
      cat_listening: 'Listening',
      cat_reading: 'Reading',
      cat_vocab: 'Vocab',
    },

    feature_grid: {
      speaking_title: 'Speaking',
      speaking_subtitle: 'AI partner 24/7. No shame, no grades.',
      writing_title: 'Writing',
      writing_subtitle: 'Texts with error breakdowns and hints.',
      vocab_title: 'Vocab',
      vocab_subtitle: 'Words in context + smart spaced repetition.',
      ai_title: 'AI lessons',
      ai_subtitle: 'Adapt to your level and interests.',
    },

    value_prop: {
      title: '50× more affordable than a tutor.',
      subtitle: 'And every day — no schedule, any time.',
      continue_label: 'See the plan',
      stats: {
        users_number: '500K+',
        users_label: 'learners',
        rating_number: '4.8',
        rating_label: 'average rating',
        cheaper_number: '50×',
        cheaper_label: 'cheaper',
      },
    },

    notifications: {
      title: 'Turn on notifications?',
      subtitle: 'Without reminders, 90% of users lose their streak. Push is the main way back.',
      cta_enable: 'Enable notifications',
      cta_next: 'Continue',
      skip: 'Skip',
      channels: {
        streak_title:        'Streak at risk',
        streak_desc:         'When your streak is about to burn.',
        practice_title:      'Time to practice',
        practice_desc:       'If you have due cards and haven’t studied yet.',
        achievements_title:  'Achievements & friend requests',
        achievements_desc:   'When you unlock an achievement or get a friend request.',
        quiet_title:         'Quiet hours',
        quiet_desc:          'Set a window when push won’t come.',
      },
      status: {
        subscribed: '✓ Push already enabled',
        unsupported: 'Push doesn’t work in the simulator. On a real device — enable in Settings.',
        denied: 'Permission denied. The system dialog will open on the next attempt (if canAskAgain).',
      },
      toast: {
        enabled: 'Push enabled',
        failed_title: 'Couldn’t enable push',
      },
    },

    reaction: {
      continue: 'Continue',
    },

    placement_test: {
      prompt: {
        translate_to_target: 'How do you say it in the target language?',
        fill_blank: 'Fill in the blank',
        pick_meaning: 'What does this word mean?',
        default: 'Pick the correct option',
      },
      question_progress: 'Question {{index}} / {{total}}',
      finish: 'Done',
    },

    done: {
      title: 'All set!',
      subtitle: 'Profile is ready. Time for your first lesson.',
      continue_label: 'To lessons',
      plan_title: 'Your plan',
      plan_lang: 'Language',
      plan_level: 'Level',
      plan_goal_xp: 'Daily goal',
      xp_suffix: '{{xp}} XP',
      footer_note: 'You can change settings later in your profile.',
      toast_failed: 'Couldn’t finish',
      level: {
        beginner: 'From scratch',
        a1: 'A1',
        a2: 'A2',
        b1: 'B1',
        b2: 'B2',
        just_for_fun: 'Just for fun',
        unknown: '—',
      },
      value_dash: '—',
    },

    paywall: {
      title: 'Unlock your personal plan',
      subtitle: '3 days free — then the plan you choose.',
      cta: 'Start learning today →',
      cta_note: '3-day free trial included',
      features: {
        unlimited:  'Unlimited lessons and AI conversation partner',
        skills:     'Speaking / Writing / Vocab — no limits',
        adaptive:   'Adaptive plan tailored to your goals',
        trial:      '3 days free — cancel anytime',
      },
      sku: {
        annual_title: 'Annual',
        annual_badge: 'Best value',
        annual_saving: 'Save 27% compared to monthly',
        monthly_title: 'Monthly',
        per_month: '/mo · {{total}}',
      },
      exit_intent: {
        title: 'Wait — here’s a 50% discount',
        body: 'Right now: $4.99/mo instead of $9.99. 3-day free trial — cancel anytime.',
        accept: 'Get the discount',
        dismiss: 'No, thanks',
      },
    },

    signup: {
      title: 'Save your progress',
      subtitle: 'Create an account in a second — XP, streak and plan won’t be lost.',
      login_link: 'I already have an account →',
      skip: 'Later',
      terms: 'By continuing you agree to ToS · Privacy',
      no_oauth_hint: 'ℹ️ OAuth is unavailable in this build (requires an EAS dev/production build with Google Web Client ID and iOS Apple Sign-In capability). You can continue as a guest — progress is saved locally.',
      toast_failed: 'Couldn’t sign in',
      oauth: {
        google: 'Continue with Google',
        apple: 'Continue with Apple',
      },
      email: {
        email_placeholder: 'Email',
        username_placeholder: 'Username',
        password_placeholder: 'Password (min 8 chars)',
        submit: 'Sign up',
        submitting: 'Creating account…',
        divider: 'or',
        err_email: 'Enter a valid email',
        err_username: 'Username must be at least 3 characters',
        err_password: 'Password must be at least 8 characters',
      },
    },
  },

  home: {
    my_languages: {
      title: '🌍 My languages',
      add: 'Add',
      add_a11y_label: 'Add a language',
      add_a11y_hint: 'Coming soon — multiple languages',
      add_more_a11y: 'Add another language',
      add_more_label: 'Add another\nlanguage',
      not_selected: 'Not selected',
      coming_soon_title: 'Coming soon',
      coming_soon_body: 'Multiple languages — in the next version.',
      level: {
        beginner: 'From scratch',
        a1: 'A1',
        a2: 'A2',
        b1: 'B1',
        b2: 'B2',
        just_for_fun: 'Just for fun',
        unknown: 'Level not set',
      },
    },
  },

  add_language: {
    title: 'Add a language',
    back_a11y: 'Back',
    stage_language_caption: 'Step 1 of 2 — pick a language',
    stage_level_caption: 'Step 2 of 2 — your level',
    pick_language_title: 'Which language are we learning?',
    pick_language_subtitle:
      'For now the app uses one primary language. Picking a new one will switch the default — your old progress is kept.',
    pick_level_title: "What's your level?",
    pick_level_subtitle: 'Pick a starting level for "{{language}}".',
    cta_done: 'Done',
    cta_submitting: 'Saving…',
    success_title: 'Language switched',
    success_body: 'Home will refresh automatically.',
  },
} as const;

export default en;
