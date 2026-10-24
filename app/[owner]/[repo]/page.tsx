import type { Metadata } from 'next';
import MermaidDiagram from '../../MermaidDiagram';

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree' | 'commit';
}

interface GitHubTreeResponse {
  tree?: GitHubTreeItem[];
  truncated?: boolean;
}

interface GitHubRepositoryResponse {
  default_branch?: string;
}

interface RepositoryDiagram {
  markup: string;
  truncated: boolean;
}

const GITHUB_API = 'https://api.github.com';
const MAX_DISPLAYED_FILES = 30;
const REPOSITORY_SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/;

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  return { title: `Architecture: ${owner} / ${repo}` };
}

export default async function DiagramPage({ params }: PageProps) {
  const { owner, repo } = await params;
  const repositoryName = `${owner}/${repo}`;

  if (
    !REPOSITORY_SEGMENT.test(owner) ||
    !REPOSITORY_SEGMENT.test(repo) ||
    owner === '.' ||
    owner === '..' ||
    repo === '.' ||
    repo === '..'
  ) {
    return <RepositoryError message="The repository owner or name is invalid." />;
  }

  let diagram: RepositoryDiagram;
  try {
    diagram = await fetchRepositoryDiagram(owner, repo);
  } catch (error) {
    console.error(`Failed to load GitHub repository ${repositoryName}:`, error);
    return (
      <RepositoryError
        message={`Could not load ${repositoryName} from GitHub. Please try again later.`}
      />
    );
  }

  return (
    <main className="page">
      <h1>Architecture: {owner} / {repo}</h1>
      {diagram.truncated && (
        <p>This diagram shows the first {MAX_DISPLAYED_FILES} repository files.</p>
      )}
      <section aria-label="Repository architecture diagram">
        <MermaidDiagram markup={diagram.markup} />
      </section>
    </main>
  );
}

async function fetchRepositoryDiagram(owner: string, repo: string): Promise<RepositoryDiagram> {
  const repositoryUrl = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const repositoryResponse = await fetch(repositoryUrl, {
    headers: githubHeaders(),
    next: { revalidate },
  });
  if (!repositoryResponse.ok) {
    throw new Error(`GitHub repository request failed with status ${repositoryResponse.status}.`);
  }

  const repository = (await repositoryResponse.json()) as GitHubRepositoryResponse;
  const branch = repository.default_branch;
  if (!branch) {
    throw new Error('GitHub repository response did not include a default branch.');
  }

  const treeUrl = `${repositoryUrl}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const treeResponse = await fetch(treeUrl, {
    headers: githubHeaders(),
    next: { revalidate },
  });
  if (!treeResponse.ok) {
    throw new Error(`GitHub tree request failed with status ${treeResponse.status}.`);
  }

  const tree = (await treeResponse.json()) as GitHubTreeResponse;
  if (!Array.isArray(tree.tree)) {
    throw new Error('GitHub tree response did not include a valid file tree.');
  }

  const files = tree.tree
    .filter((item) => item.type === 'blob' && typeof item.path === 'string')
    .slice(0, MAX_DISPLAYED_FILES);
  const lines = ['graph TD', '  root["Repository"]'];
  files.forEach((file, index) => {
    lines.push(`  file_${index}["${escapeMermaidLabel(file.path)}"]`);
    lines.push(`  root --> file_${index}`);
  });

  return {
    markup: `${lines.join('\n')}\n`,
    truncated: Boolean(tree.truncated) || tree.tree.filter((item) => item.type === 'blob').length > files.length,
  };
}

function githubHeaders(): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gitarchitecture-app',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function escapeMermaidLabel(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/[\r\n\t]/g, ' ');
}

function RepositoryError({ message }: { message: string }) {
  return (
    <main className="page">
      <p className="error" role="alert">{message}</p>
      <p>Ensure the repository is public and the owner and repository name are correct.</p>
    </main>
  );
}
