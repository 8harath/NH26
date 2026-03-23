import { Thread } from '@/types'

export const mockThreads: Thread[] = [
  {
    id: 'thread-1',
    from: {
      name: 'Sarah Chen',
      email: 'sarah.chen@acmecorp.com',
      avatar: '👩‍💼'
    },
    subject: 'Q2 Budget Review Meeting - Urgent',
    preview: 'We need to finalize the Q2 budget allocations before the board meeting next Tuesday...',
    timestamp: '2024-03-21T09:15:00Z',
    unreadCount: 3,
    category: 'finance',
    emails: [
      {
        id: 'email-1-1',
        threadId: 'thread-1',
        from: {
          name: 'Sarah Chen',
          email: 'sarah.chen@acmecorp.com'
        },
        to: [{ name: 'You', email: 'you@acmecorp.com' }],
        subject: 'Q2 Budget Review Meeting - Urgent',
        body: `Hi,

I hope this message finds you well. We need to finalize the Q2 budget allocations before the board meeting next Tuesday.

The Finance team has prepared preliminary numbers, but we need departmental leads to review and approve their respective allocations.

Key deadlines:
- Q2 Budget draft: Friday EOD
- Final review: Monday morning
- Board presentation: Tuesday 10am

Could you please review the attached spreadsheet and confirm your team's numbers by Friday?

Best regards,
Sarah`,
        timestamp: '2024-03-21T09:15:00Z',
        isRead: true,
        attachments: [
          { name: 'Q2_Budget_Draft.xlsx', size: '2.4 MB', type: 'spreadsheet' }
        ]
      },
      {
        id: 'email-1-2',
        threadId: 'thread-1',
        from: {
          name: 'You',
          email: 'you@acmecorp.com'
        },
        to: [{ name: 'Sarah Chen', email: 'sarah.chen@acmecorp.com' }],
        subject: 'RE: Q2 Budget Review Meeting - Urgent',
        body: `Sarah,

Thanks for the heads up. I'm reviewing the numbers now. I have a few questions about the headcount allocations - can we schedule a quick sync?

I should have feedback by Thursday EOD at the latest.

Thanks`,
        timestamp: '2024-03-21T14:30:00Z',
        isRead: true
      },
      {
        id: 'email-1-3',
        threadId: 'thread-1',
        from: {
          name: 'Sarah Chen',
          email: 'sarah.chen@acmecorp.com'
        },
        to: [{ name: 'You', email: 'you@acmecorp.com' }],
        subject: 'RE: Q2 Budget Review Meeting - Urgent',
        body: `Absolutely! I can sync tomorrow (Thursday) at 2pm or Friday morning 10am - whatever works for you. Let me know!

Sarah`,
        timestamp: '2024-03-21T16:45:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-2',
    from: {
      name: 'Mike Rodriguez',
      email: 'mike.rodriguez@startup.io',
      avatar: '👨‍💼'
    },
    subject: 'Feature Request: OAuth Integration',
    preview: 'We have multiple clients requesting OAuth support. This would significantly improve our adoption...',
    timestamp: '2024-03-20T16:22:00Z',
    unreadCount: 2,
    category: 'work',
    emails: [
      {
        id: 'email-2-1',
        threadId: 'thread-2',
        from: {
          name: 'Mike Rodriguez',
          email: 'mike.rodriguez@startup.io'
        },
        to: [{ name: 'You', email: 'you@startup.io' }],
        subject: 'Feature Request: OAuth Integration',
        body: `Hey there,

We have multiple clients requesting OAuth support (Google, GitHub, Microsoft). This would significantly improve our adoption and reduce friction for enterprise customers.

From our sales pipeline, I'd estimate we could close 3-4 deals if we had this feature within 6 weeks.

Could you scope this out and provide an estimate? Would also help if we could get this on the roadmap ASAP.

Thanks!
Mike`,
        timestamp: '2024-03-20T16:22:00Z',
        isRead: true
      },
      {
        id: 'email-2-2',
        threadId: 'thread-2',
        from: {
          name: 'You',
          email: 'you@startup.io'
        },
        to: [{ name: 'Mike Rodriguez', email: 'mike.rodriguez@startup.io' }],
        subject: 'RE: Feature Request: OAuth Integration',
        body: `Mike,

Good timing - we were already scoping OAuth. I think we can realistically deliver Google + GitHub in 3-4 weeks if we prioritize it.

Let me pull together a more detailed estimate and we can discuss in our next sync.

Cheers`,
        timestamp: '2024-03-21T08:45:00Z',
        isRead: true
      },
      {
        id: 'email-2-3',
        threadId: 'thread-2',
        from: {
          name: 'Mike Rodriguez',
          email: 'mike.rodriguez@startup.io'
        },
        to: [{ name: 'You', email: 'you@startup.io' }],
        subject: 'RE: Feature Request: OAuth Integration',
        body: `That's great news! 3-4 weeks works perfectly. Let's sync Friday at 3pm to finalize details?

Mike`,
        timestamp: '2024-03-21T11:20:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-3',
    from: {
      name: 'Lisa Wong',
      email: 'lisa.wong@designstudio.co',
      avatar: '👩‍🎨'
    },
    subject: 'Website Redesign - Design Review Round 2',
    preview: "I've incorporated most of the feedback from the first review. Please check the updated mockups...",
    timestamp: '2024-03-19T13:10:00Z',
    unreadCount: 1,
    category: 'work',
    emails: [
      {
        id: 'email-3-1',
        threadId: 'thread-3',
        from: {
          name: 'Lisa Wong',
          email: 'lisa.wong@designstudio.co'
        },
        to: [{ name: 'You', email: 'you@designstudio.co' }],
        subject: 'Website Redesign - Design Review Round 2',
        body: `Hi,

I've incorporated most of the feedback from the first review. The updated mockups are ready for review.

Key changes:
- Refined hero section layout
- New navigation structure
- Updated color palette per brand guidelines
- Improved mobile responsiveness

Link to Figma: [figma.com/design/...]

Would love to get your feedback this week so we can move forward with dev handoff.

Cheers,
Lisa`,
        timestamp: '2024-03-19T13:10:00Z',
        isRead: true,
        attachments: [
          { name: 'Mockups_V2.fig', size: '18.7 MB', type: 'design' }
        ]
      },
      {
        id: 'email-3-2',
        threadId: 'thread-3',
        from: {
          name: 'You',
          email: 'you@designstudio.co'
        },
        to: [{ name: 'Lisa Wong', email: 'lisa.wong@designstudio.co' }],
        subject: 'RE: Website Redesign - Design Review Round 2',
        body: `Lisa,

Looks great! I'll review the mockups and get you feedback by EOD tomorrow.

Quick question - did you get a chance to update the pricing page layout we discussed?

Talk soon`,
        timestamp: '2024-03-19T15:30:00Z',
        isRead: true
      },
      {
        id: 'email-3-3',
        threadId: 'thread-3',
        from: {
          name: 'Lisa Wong',
          email: 'lisa.wong@designstudio.co'
        },
        to: [{ name: 'You', email: 'you@designstudio.co' }],
        subject: 'RE: Website Redesign - Design Review Round 2',
        body: `Yep, it's in the latest version. Let me know what you think!

Lisa`,
        timestamp: '2024-03-21T10:05:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-4',
    from: {
      name: 'Alex Kumar',
      email: 'alex.kumar@techventures.com',
      avatar: '👨‍🚀'
    },
    subject: 'Team Offsite Planning - Next Quarter',
    preview: 'I\'ve compiled suggestions for the Q2 team offsite. We need to finalize dates and location...',
    timestamp: '2024-03-18T11:45:00Z',
    unreadCount: 1,
    category: 'personal',
    emails: [
      {
        id: 'email-4-1',
        threadId: 'thread-4',
        from: {
          name: 'Alex Kumar',
          email: 'alex.kumar@techventures.com'
        },
        to: [{ name: 'You', email: 'you@techventures.com' }],
        subject: 'Team Offsite Planning - Next Quarter',
        body: `Hey,

I've compiled suggestions for the Q2 team offsite. We need to finalize dates and location ASAP so we can book accommodations.

Proposed dates:
- May 15-17
- May 22-24
- June 5-7

Proposed locations:
- Lake Tahoe
- Big Sur
- Sedona

Could you share this with the team and get feedback on preferred dates/location? Ideally by end of week?

Thanks!
Alex`,
        timestamp: '2024-03-18T11:45:00Z',
        isRead: true
      },
      {
        id: 'email-4-2',
        threadId: 'thread-4',
        from: {
          name: 'You',
          email: 'you@techventures.com'
        },
        to: [{ name: 'Alex Kumar', email: 'alex.kumar@techventures.com' }],
        subject: 'RE: Team Offsite Planning - Next Quarter',
        body: `Will do! I'll send out a poll to the team today and get responses back by Friday.

My initial take: May 22-24 works best for me, and Big Sur would be amazing.

Alex`,
        timestamp: '2024-03-18T14:20:00Z',
        isRead: true
      },
      {
        id: 'email-4-3',
        threadId: 'thread-4',
        from: {
          name: 'Alex Kumar',
          email: 'alex.kumar@techventures.com'
        },
        to: [{ name: 'You', email: 'you@techventures.com' }],
        subject: 'RE: Team Offsite Planning - Next Quarter',
        body: `Great! Big Sur was my top pick too. Looking forward to team feedback.

Once we have results, I'll start reaching out to venues.

Cheers`,
        timestamp: '2024-03-21T09:30:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-5',
    from: {
      name: 'Rebecca Martinez',
      email: 'rebecca.martinez@consultancy.com',
      avatar: '👩‍💻'
    },
    subject: 'Client Proposal Review - TechCorp Initiative',
    preview: 'The proposal for the TechCorp digital transformation is ready for your review. Please...',
    timestamp: '2024-03-17T15:55:00Z',
    unreadCount: 0,
    category: 'work',
    emails: [
      {
        id: 'email-5-1',
        threadId: 'thread-5',
        from: {
          name: 'Rebecca Martinez',
          email: 'rebecca.martinez@consultancy.com'
        },
        to: [{ name: 'You', email: 'you@consultancy.com' }],
        subject: 'Client Proposal Review - TechCorp Initiative',
        body: `Hi,

The proposal for the TechCorp digital transformation is ready for your review. This is a significant engagement ($250K+ contract), so your input is valuable.

Highlights:
- 6-month engagement
- Full digital strategy + implementation
- Team of 5 consultants
- Expected ROI: 35% first year

Proposal attached and also shared in our project folder.

Let me know if you have questions!

Rebecca`,
        timestamp: '2024-03-17T15:55:00Z',
        isRead: true,
        attachments: [
          { name: 'TechCorp_Proposal_v3.pdf', size: '4.1 MB', type: 'pdf' }
        ]
      },
      {
        id: 'email-5-2',
        threadId: 'thread-5',
        from: {
          name: 'You',
          email: 'you@consultancy.com'
        },
        to: [{ name: 'Rebecca Martinez', email: 'rebecca.martinez@consultancy.com' }],
        subject: 'RE: Client Proposal Review - TechCorp Initiative',
        body: `Rebecca,

Reviewed the proposal - looks solid! A few minor notes:

1. Timeline on page 3 could use more detail on Phase 2
2. Consider adding case study reference on page 7
3. Pricing is competitive

These are minor tweaks. Overall, I think we're ready to present to the client.

Great work!`,
        timestamp: '2024-03-17T17:30:00Z',
        isRead: true
      },
      {
        id: 'email-5-3',
        threadId: 'thread-5',
        from: {
          name: 'Rebecca Martinez',
          email: 'rebecca.martinez@consultancy.com'
        },
        to: [{ name: 'You', email: 'you@consultancy.com' }],
        subject: 'RE: Client Proposal Review - TechCorp Initiative',
        body: `Perfect! I'll make those adjustments today and we can present to TechCorp on Monday.

Thanks for the quick feedback!

Rebecca`,
        timestamp: '2024-03-18T09:15:00Z',
        isRead: true
      }
    ]
  },
  {
    id: 'thread-6',
    from: {
      name: 'James Thompson',
      email: 'james.thompson@marketing.io',
      avatar: '📊'
    },
    subject: 'Campaign Performance Report - March',
    preview: 'The March campaign report is complete. Overall performance exceeded targets by 23%...',
    timestamp: '2024-03-16T10:30:00Z',
    unreadCount: 0,
    category: 'updates',
    emails: [
      {
        id: 'email-6-1',
        threadId: 'thread-6',
        from: {
          name: 'James Thompson',
          email: 'james.thompson@marketing.io'
        },
        to: [{ name: 'You', email: 'you@marketing.io' }],
        subject: 'Campaign Performance Report - March',
        body: `Hi,

The March campaign report is complete. Overall performance exceeded targets by 23%.

Key metrics:
- Reach: 2.3M impressions (+31% vs target)
- Engagement: 45K interactions (+18% vs target)
- Conversions: 1,250 leads (+28% vs target)
- Cost per lead: $8.50 (-15% vs budget)

The social media strategy pivot in week 2 really paid off. Detailed analysis attached.

James`,
        timestamp: '2024-03-16T10:30:00Z',
        isRead: true,
        attachments: [
          { name: 'March_Campaign_Report.pdf', size: '1.8 MB', type: 'pdf' }
        ]
      },
      {
        id: 'email-6-2',
        threadId: 'thread-6',
        from: {
          name: 'You',
          email: 'you@marketing.io'
        },
        to: [{ name: 'James Thompson', email: 'james.thompson@marketing.io' }],
        subject: 'RE: Campaign Performance Report - March',
        body: `Excellent work, James! These numbers are fantastic.

Can you prepare an exec summary for the board? Maybe a 1-pager with the top 3 wins?

Let's also discuss scaling the social strategy for Q2.`,
        timestamp: '2024-03-16T13:45:00Z',
        isRead: true
      },
      {
        id: 'email-6-3',
        threadId: 'thread-6',
        from: {
          name: 'James Thompson',
          email: 'james.thompson@marketing.io'
        },
        to: [{ name: 'You', email: 'you@marketing.io' }],
        subject: 'RE: Campaign Performance Report - March',
        body: `On it! I'll have the exec summary by EOD tomorrow. Let's sync next week about Q2 strategy.

Thanks!`,
        timestamp: '2024-03-16T16:20:00Z',
        isRead: true
      }
    ]
  },
  {
    id: 'thread-7',
    from: {
      name: 'Amazon',
      email: 'order-update@amazon.com',
      avatar: '📦'
    },
    subject: 'Your order has shipped! Tracking #1Z999AA10123456784',
    preview: 'Your package is on its way! Estimated delivery: March 25...',
    timestamp: '2024-03-22T08:00:00Z',
    unreadCount: 1,
    category: 'updates',
    emails: [
      {
        id: 'email-7-1',
        threadId: 'thread-7',
        from: { name: 'Amazon', email: 'order-update@amazon.com' },
        to: [{ name: 'You', email: 'you@gmail.com' }],
        subject: 'Your order has shipped! Tracking #1Z999AA10123456784',
        body: `Hello,

Your order #112-7654321-9876543 has shipped!

Items:
- Apple AirPods Pro (2nd Gen) — $249.99
- USB-C Charging Cable (2-pack) — $12.99

Estimated delivery: Monday, March 25
Carrier: UPS
Tracking: 1Z999AA10123456784

Track your package at amazon.com/orders

Thank you for shopping with Amazon!`,
        timestamp: '2024-03-22T08:00:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-8',
    from: {
      name: 'David Park',
      email: 'david.park@acmecorp.com',
      avatar: '🧑‍💻'
    },
    subject: 'Code Review: Auth service refactor PR #247',
    preview: "I've pushed the auth service refactor. Can you review when you get a chance?",
    timestamp: '2024-03-22T11:30:00Z',
    unreadCount: 2,
    category: 'work',
    emails: [
      {
        id: 'email-8-1',
        threadId: 'thread-8',
        from: { name: 'David Park', email: 'david.park@acmecorp.com' },
        to: [{ name: 'You', email: 'you@acmecorp.com' }],
        subject: 'Code Review: Auth service refactor PR #247',
        body: `Hey,

I've pushed the auth service refactor to PR #247. Key changes:

1. Migrated from JWT to session-based auth
2. Added rate limiting on login endpoints
3. Implemented refresh token rotation
4. Added audit logging for auth events

The test coverage is at 94%. I've also updated the API docs.

Can you review when you get a chance? Ideally before Thursday so we can ship it in the next release.

Thanks!
David`,
        timestamp: '2024-03-22T11:30:00Z',
        isRead: false
      },
      {
        id: 'email-8-2',
        threadId: 'thread-8',
        from: { name: 'David Park', email: 'david.park@acmecorp.com' },
        to: [{ name: 'You', email: 'you@acmecorp.com' }],
        subject: 'RE: Code Review: Auth service refactor PR #247',
        body: `Quick update — I also added CSRF protection middleware. The diff is a bit larger now but the security audit required it.

Let me know if you have questions about any of the changes.

David`,
        timestamp: '2024-03-22T14:15:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-9',
    from: {
      name: 'Stripe',
      email: 'receipts@stripe.com',
      avatar: '💳'
    },
    subject: 'Payment receipt from Vercel Inc.',
    preview: 'Your payment of $20.00 to Vercel Inc. was successful...',
    timestamp: '2024-03-21T06:00:00Z',
    unreadCount: 1,
    category: 'finance',
    emails: [
      {
        id: 'email-9-1',
        threadId: 'thread-9',
        from: { name: 'Stripe', email: 'receipts@stripe.com' },
        to: [{ name: 'You', email: 'you@gmail.com' }],
        subject: 'Payment receipt from Vercel Inc.',
        body: `Payment confirmation

Amount: $20.00
To: Vercel Inc.
Date: March 21, 2024
Card: Visa ending in 4242
Invoice: INV-2024-0321-VCL

Description: Vercel Pro Plan — Monthly subscription

If you have questions about this charge, contact Vercel support at vercel.com/support.

— Stripe`,
        timestamp: '2024-03-21T06:00:00Z',
        isRead: false,
        attachments: [
          { name: 'receipt_2024_0321.pdf', size: '45 KB', type: 'pdf' }
        ]
      }
    ]
  },
  {
    id: 'thread-10',
    from: {
      name: 'Priya Sharma',
      email: 'priya.sharma@team.co',
      avatar: '👩‍🔬'
    },
    subject: 'RE: Weekend hiking trip plans',
    preview: "How about we do the Sunrise Peak trail? It's about 6 miles round trip...",
    timestamp: '2024-03-22T19:45:00Z',
    unreadCount: 1,
    category: 'personal',
    emails: [
      {
        id: 'email-10-1',
        threadId: 'thread-10',
        from: { name: 'You', email: 'you@gmail.com' },
        to: [{ name: 'Priya Sharma', email: 'priya.sharma@team.co' }],
        subject: 'Weekend hiking trip plans',
        body: `Hey Priya!

Are we still on for the hike this Saturday? I was thinking we could try a new trail. Let me know what works for you!

Cheers`,
        timestamp: '2024-03-22T16:00:00Z',
        isRead: true
      },
      {
        id: 'email-10-2',
        threadId: 'thread-10',
        from: { name: 'Priya Sharma', email: 'priya.sharma@team.co' },
        to: [{ name: 'You', email: 'you@gmail.com' }],
        subject: 'RE: Weekend hiking trip plans',
        body: `Hey!

Absolutely! How about we do the Sunrise Peak trail? It's about 6 miles round trip with some great views at the top.

I can pick you up at 7am — we should start early before it gets too hot.

Also, Raj and Nina might join us. I'll confirm with them tonight.

Don't forget to bring plenty of water!

— Priya`,
        timestamp: '2024-03-22T19:45:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-11',
    from: {
      name: 'GitHub',
      email: 'notifications@github.com',
      avatar: '🐙'
    },
    subject: '[acme/platform] Issue #892: Production API latency spike',
    preview: 'New issue opened by @oncall-bot: API p99 latency exceeded 2s threshold...',
    timestamp: '2024-03-22T22:10:00Z',
    unreadCount: 1,
    category: 'work',
    emails: [
      {
        id: 'email-11-1',
        threadId: 'thread-11',
        from: { name: 'GitHub', email: 'notifications@github.com' },
        to: [{ name: 'You', email: 'you@acmecorp.com' }],
        subject: '[acme/platform] Issue #892: Production API latency spike',
        body: `@oncall-bot opened this issue:

**Production API latency spike detected**

Severity: P1
Started: 2024-03-22 21:45 UTC
Affected services: /api/v2/users, /api/v2/orders

Metrics:
- p99 latency jumped from 200ms to 2.4s
- Error rate increased to 3.2%
- Affected region: us-east-1

Potential cause: Database connection pool exhaustion after deploy v2.14.3

Action items:
1. Investigate connection pool settings
2. Consider rolling back to v2.14.2
3. Check if recent migration is causing lock contention

cc: @you @david-park @sre-team`,
        timestamp: '2024-03-22T22:10:00Z',
        isRead: false
      }
    ]
  },
  {
    id: 'thread-12',
    from: {
      name: 'Netflix',
      email: 'info@mailer.netflix.com',
      avatar: '🎬'
    },
    subject: 'New arrivals you might like',
    preview: "Based on your viewing history, we think you'll enjoy these new titles...",
    timestamp: '2024-03-20T14:00:00Z',
    unreadCount: 0,
    category: 'spam',
    emails: [
      {
        id: 'email-12-1',
        threadId: 'thread-12',
        from: { name: 'Netflix', email: 'info@mailer.netflix.com' },
        to: [{ name: 'You', email: 'you@gmail.com' }],
        subject: 'New arrivals you might like',
        body: `Hi there,

Based on your viewing history, we think you'll enjoy these new titles:

🎬 The Algorithm — A tech thriller about an AI that rewrites reality
📺 Code & Coffee (Season 3) — Your favorite dev comedy is back
🎬 Zero Day — Cybersecurity docuseries featuring real incidents

Start watching now at netflix.com

Enjoy!
The Netflix Team

To unsubscribe from these emails, visit netflix.com/email-preferences`,
        timestamp: '2024-03-20T14:00:00Z',
        isRead: true
      }
    ]
  }
]
