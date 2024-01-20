import { Devvit } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true
})

Devvit.addSettings([
  {
    type: 'string',
    name: 'blacklist_flair_template',
    label: 'Blacklist flair template:'
  }
]
)

const dynamicForm = Devvit.createForm((data) => {
  return {
    fields: [
      { name: 'username', label: 'username', type: 'string', disabled: true, defaultValue: data.username },
      { name: 'ban_duration', label: `BAN DURATION`, type: 'number', defaultValue: 0, required: true, helpText: "How long (Days)?" },
      { name: 'permanent', label: 'PERMANENT', type: 'boolean', defaultValue: false },
      { name: 'mod_note', label: 'MOD NOTE', type: 'string', placeholder: 'Mod note' },
      { name: 'ban_msg', label: 'BAN MESSAGE', type: 'paragraph', helpText: "* Visible to the banned user", placeholder: 'Reason they were banned' },
    ],
    title: `Blacklist and Ban u/${data.username}`,
    acceptLabel: 'Blacklist and Ban'
  }
}, async ({ values }, ctx) => {
  // Apply Blacklisted Flair
  const flairTemplateId = await ctx.settings.get('blacklist_flair_template') as string;
  const subreddit = await ctx.reddit.getSubredditById(ctx.subredditId);
  await ctx.reddit.setUserFlair({ username: values.username, subredditName: subreddit.name, flairTemplateId: flairTemplateId })

  if (values.permanent) {
    await ctx.reddit.banUser({
      username: values.username,
      subredditName: subreddit.name,
      note: values.mod_note,
      message: values.ban_msg,
      reason: 'No Scamming, Exploiting, or Griefing'
    })
    return ctx.ui.showToast(`${values.username} banned permanently.`)
  } else {
    await ctx.reddit.banUser({
      username: values.username,
      subredditName: subreddit.name,
      note: values.mod_note,
      message: values.ban_msg,
      duration: values.ban_duration,
      reason: 'No Scamming, Exploiting, or Griefing'
    })
    return ctx.ui.showToast(`${values.username} banned for ${values.ban_duration} days.`)
  }
})


Devvit.addMenuItem({
  label: 'Blacklist & Ban',
  location: ['post', 'comment'],
  forUserType: 'moderator',
  description: "Change flair to Blacklisted and Ban User",
  onPress: async (_event, context) => {
    let post;
    if (_event.targetId.startsWith('t1_')) {
      post = context.reddit.getCommentById(_event.targetId);
    } else {
      post = context.reddit.getPostById(_event.targetId);
    }

    const formData = {
      username: (await post).authorName,
    }

    return context.ui.showForm(dynamicForm, formData)
  }
});

export default Devvit;
