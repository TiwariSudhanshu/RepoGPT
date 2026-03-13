import requests
import base64
import os
from dotenv import load_dotenv


MAX_FILES = 200
MAX_FILE_SIZE = 200000

load_dotenv()

ALLOWED_EXTENSIONS = (
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".java", ".go", ".rs", ".cpp", ".c",
    ".md"
)


def _github_headers() -> dict:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise ValueError("GITHUB_TOKEN is not set. Add it to backend/.env.")

    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }


def get_default_branch(owner, repo):
    headers = _github_headers()

    url = f"https://api.github.com/repos/{owner}/{repo}"
    r = requests.get(url, headers=headers)
    r.raise_for_status()

    return r.json()["default_branch"]


def get_repo_tree(owner, repo, branch):
    headers = _github_headers()

    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"

    r = requests.get(url, headers=headers)
    r.raise_for_status()

    data = r.json()

    files = []

    for item in data["tree"]:

        if item["type"] != "blob":
            continue

        path = item["path"]

        if not path.endswith(ALLOWED_EXTENSIONS):
            continue

        files.append(path)

        if len(files) >= MAX_FILES:
            break

    return files


def get_file_content(owner, repo, path):
    headers = _github_headers()

    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    r = requests.get(url, headers=headers)
    r.raise_for_status()

    data = r.json()

    encoded = data["content"]

    try:
        decoded = base64.b64decode(encoded).decode("utf-8")
    except UnicodeDecodeError:
        return None

    if len(decoded) > MAX_FILE_SIZE:
        return None

    return decoded


def load_repo(owner, repo):

    branch = get_default_branch(owner, repo)

    files = get_repo_tree(owner, repo, branch)

    documents = []

    for path in files:

        content = get_file_content(owner, repo, path)

        if content is None:
            continue

        documents.append(
            {
                "owner": owner,
                "repo": repo,
                "branch": branch,
                "path": path,
                "text": content
            }
        )

    return documents
