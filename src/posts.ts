import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { graphql } from '@octokit/graphql';
import juice from 'juice';

import { mdParser } from './render';

const graphqlClient = graphql.defaults({
  headers: {
    authorization: `token xxx`,
  },
});

const fmtIssues = (issues: number) => issues.toString().padStart(4, '0');

getPosts({ owner: 'lencx', repo: 'ohmybox', otherLabels: 'Tauri 系列', root: 'posts' })

async function getPosts({ owner, repo, otherLabels = '', root }) {
  let last = null;
  let totalCount = 0;
  const _data: any = await graphqlClient(`
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions {
          totalCount
        }
      }
    }
  `, {
    owner,
    repo,
  });

  totalCount = _data.repository.discussions.totalCount;
  for (let i = 0; i < Math.ceil(totalCount / 100); i++) {
    const result = await getIssues({ owner, repo, lastCursor: last });

    result.forEach(({ node: post }) => {
      const { labels, number, body, title } = post;
      const _labels = labels.edges;

      _labels.forEach(async ({ node: label }) => {
        if (['woap-link', 'woap-post', ...(otherLabels.split(','))].includes(label.name)) {
          const _root = path.resolve(root, `issues-${fmtIssues(number)}`);
          writePost({ root: _root, number, content: `# ${title}\n\n${body}\n`, title });
        }
      })
    });

    last = (Array.from(result).pop() as any).cursor;
  }
}

async function getIssues({ owner, repo, lastCursor }) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 100, after: $cursor) {
          edges {
            cursor
            node {
              title
              number
              body
              labels(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `, {
    owner,
    repo,
    cursor: lastCursor,
  });

  return repository.discussions.edges;
}

const render = (content: string) => `<!DOCTYPE html>
<html>
<head>
<style>
${fs.readFileSync(path.resolve(__dirname, 'main.css'))}
${fs.readFileSync(path.resolve(__dirname, 'agate.css'))}
</style>
<script>
${fs.readFileSync(path.resolve(__dirname, 'copy.js'))}
</script>
</head>
<body>
<button id="woap-btn">copy</button>
<div id="woap-body">
${content}
</div>
</body>
</html>`

export function writePost({ root, number, title, content }) {
  mkdir(root);
  const _md = path.resolve(root, `${title}.md`);
  const _html = path.resolve(root, `${title}.html`);
  try {
    fs.writeFileSync(_md, content);
    fs.writeFileSync(_html, juice(render(mdParser.render(content))));
    console.log(chalk.green(`[📝 ${fmtIssues(number)}] ${title}`), '~>', chalk.grey(_md));
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

export function mkdir(root: string) {
  try {
    const isExist = fs.existsSync(root);
    if (!isExist) fs.mkdirSync(root, { recursive: true });
  } catch (e) {
    console.error(e);
    process.exit();
  }
}