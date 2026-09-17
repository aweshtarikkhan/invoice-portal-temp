const fs = require('fs');
let c = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

c = c.replace(
  'const { enabledGroups, isAdmin, teamMembers, isGroupEnabled, platformFeatures } = useFeatureStore();',
  'const { enabledGroups, isAdmin, teamMembers, isGroupEnabled, platformFeatures, subscriptionPlan } = useFeatureStore();'
);

const checkFeatureStr = `  ].map(g => {
    let hasPlatformFeature = platformFeatures.includes(g.key);
    if (g.key === 'outreach' && subscriptionPlan && subscriptionPlan !== 'free') {
      hasPlatformFeature = true;
    }
    return { ...g, isLocked: !isGroupEnabled(g.key) || !hasPlatformFeature };
  });`;

c = c.replace(
  `  ].map(g => ({ ...g, isLocked: !isGroupEnabled(g.key) || !platformFeatures.includes(g.key) }));`,
  checkFeatureStr
);

const featureGroupsStr = `        let hasPlatformFeature = platformFeatures.includes(g.key);
        if (g.key === 'outreach' && subscriptionPlan && subscriptionPlan !== 'free') {
          hasPlatformFeature = true;
        }
        
        return {
          key: g.key,
          label: g.label,
          isUpcoming: g.isUpcoming,
          isLocked: !isGroupEnabled(g.key) || !hasPlatformFeature,`;

c = c.replace(
  `        return {
          key: g.key,
          label: g.label,
          isUpcoming: g.isUpcoming,
          isLocked: !isGroupEnabled(g.key) || !platformFeatures.includes(g.key),`,
  featureGroupsStr
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', c);
console.log('Updated AppSidebar to unlock outreach for all paid plans');
