const fs=require('fs');
const path=require('path');
const map=[
  ['align-right','align-right'],
  ['arrow-up','arrow-up'],
  ['arrow-left','arrow-left'],
  ['arrow-right','arrow-right'],
  ['archive','archive'],
  ['bubble-5','message-circle'],
  ['prompt','sparkles'],
  ['brain','brain'],
  ['fork','git-branch'],
  ['bullet-list','list'],
  ['check-small','check'],
  ['chevron-down','chevron-down'],
  ['chevron-left','chevron-left'],
  ['chevron-right','chevron-right'],
  ['chevron-grabber-vertical','grip-vertical'],
  ['chevron-double-right','chevrons-right'],
  ['circle-x','circle-x'],
  ['close','x'],
  ['close-small','x'],
  ['checklist','list-check'],
  ['console','terminal'],
  ['terminal','terminal'],
  ['terminal-active','terminal'],
  ['review','clipboard-list'],
  ['review-active','clipboard-list'],
  ['expand','maximize'],
  ['collapse','minimize'],
  ['code','code'],
  ['code-lines','code'],
  ['circle-ban-sign','ban'],
  ['edit-small-2','pencil'],
  ['eye','eye'],
  ['enter','arrow-right-bar'],
  ['folder','folder'],
  ['file-tree','files'],
  ['file-tree-active','files'],
  ['magnifying-glass','search'],
  ['plus-small','plus'],
  ['plus','plus'],
  ['new-session','calendar-plus'],
  ['new-session-active','calendar-plus'],
  ['pencil-line','pencil'],
  ['mcp','sparkles'],
  ['glasses','eyeglass'],
  ['magnifying-glass-menu','search'],
  ['window-cursor','cursor-text'],
  ['task','list-check'],
  ['stop','square'],
  ['status','activity'],
  ['status-active','activity'],
  ['sidebar','layout-sidebar'],
  ['sidebar-active','layout-sidebar'],
  ['layout-left','layout-sidebar-left-expand'],
  ['layout-left-partial','layout-sidebar-left-collapse'],
  ['layout-left-full','layout-sidebar-left-expand'],
  ['layout-right','layout-sidebar-right-expand'],
  ['layout-right-partial','layout-sidebar-right-collapse'],
  ['layout-right-full','layout-sidebar-right-expand'],
  ['square-arrow-top-right','arrow-up-right'],
  ['open-file','file'],
  ['speech-bubble','message-circle'],
  ['comment','message-circle'],
  ['folder-add-left','folder-plus'],
  ['github','brand-github'],
  ['discord','brand-discord'],
  ['layout-bottom','layout-bottombar'],
  ['layout-bottom-partial','layout-bottombar-collapse'],
  ['layout-bottom-full','layout-bottombar-expand'],
  ['dot-grid','grid-dots'],
  ['circle-check','circle-check'],
  ['copy','copy'],
  ['check','check'],
  ['photo','photo'],
  ['share','share'],
  ['shield','shield'],
  ['download','download'],
  ['menu','menu'],
  ['server','server'],
  ['branch','git-branch'],
  ['edit','pencil'],
  ['help','help-circle'],
  ['settings-gear','settings'],
  ['dash','minus'],
  ['cloud-upload','cloud-upload'],
  ['trash','trash'],
  ['sliders','adjustments'],
  ['keyboard','keyboard'],
  ['selector','selector'],
  ['arrow-down-to-line','arrow-down'],
  ['warning','alert-circle'],
  ['reset','refresh'],
  ['link','link'],
  ['providers','layout-grid'],
  ['models','layers-linked']
];
const slugs=[...new Set(map.map(([,slug])=>slug))];
const iconDir=path.join('node_modules','@tabler','icons','icons','outline');
const snippets={};
for(const slug of slugs){
  const file=path.join(iconDir,`${slug}.svg`);
  if(!fs.existsSync(file)){throw new Error(`Missing Tabler icon file: ${slug}`);}
  const raw=fs.readFileSync(file,'utf-8');
  const inner=raw.replace(/^[\s\S]*?<svg[^>]*>/i,'').replace(/<\/svg>[\s\S]*$/i,'').trim();
  snippets[slug]=inner.replace(/`/g,'\\`');
}
const snippetLines=Object.entries(snippets)
  .map(([slug,inner])=>`  "${slug}": ` + '`' + `\n${inner}\n` + '`')
  .join(',\n');
const mappingLines=map.map(([name,slug])=>`  "${name}": "${slug}"`).join(',\n');
const content=`// GENERATED FILE -- tabler glyphs pulled from @tabler/icons.
// Regenerate by running scripts/gen-tabler-icons.js.

export const tablerIconSnippets = {
${snippetLines}
} as const;

export const iconNameToTablerSlug = {
${mappingLines}
} as const;
`;
fs.writeFileSync('packages/ui/src/components/tabler-icon-snippets.ts',content);
