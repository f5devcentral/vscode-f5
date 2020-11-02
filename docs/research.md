---
title: Help Center
navigation:
  - section: Help Center
  - document: overview_doc
    label: Overview
  - document: data_sources_doc
    label: Data Sources
  - document: data_definitions_doc
    label: Data Definitions
  - document: faq_doc
    label: FAQ
  - document: release_notes_doc
    label: Release Notes
---



<div id="sideMenu"> 
	[TOC] 
    - toc1
    - toc2
</div> 
<div id="mainContent"> 
	[CONTENT] 
</div> 

Welcome to the vscode-f5 wiki!


Looking for a good way to document everything the extension has to offer while providing the most flexibility and accessability for everyone.

Really need to take the documentation to the next level to provide everyone with the details needed to really harness the power of the extension.  This does include breif 3-5 minute youtube videos for various features

    - clean up, organize and add content including youtube video links

I see the following options:

- documentation as part of the core repo
  - pretty much add on to what is already there
  - Provides restricted access that alligns with repo contributors and integrates with existing workflows of branching, changes, merges, approvals
  - Doesn't look like side bars are supported, but there are tools to easily integrate indexs and table of contents to make browsing easy
  - https://github.com/josemiguelmelo/markdown-index-generator
  - https://github.com/yzhang-gh/vscode-markdown
  - https://docsifyjs.netlify.app/#/?id=docsify
    - this one looks interesting...
  - https://github.com/mixu/markdown-styles
- Repo wiki
  - Similar to the core repo above, but does not have the full change tracking of a regular repo, like diffs, branches, pull requrests and approvals.
  - It's hosted as it's own git associated with the core repo
    - https://github.com/f5devcentral/vscode-f5.wiki.git
  - However, it does provide a nice interface with side bars, indexes, headers and footers
