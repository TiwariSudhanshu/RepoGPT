from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_documents(documents):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = []

    for doc in documents:

        parts = splitter.split_text(doc["text"])

        for part in parts:

            chunks.append(
                {
                    "text": part,
                    "metadata": {
                        "owner": doc["owner"],
                        "repo": doc["repo"],
                        "branch": doc["branch"],
                        "path": doc["path"]
                    }
                }
            )

    return chunks
