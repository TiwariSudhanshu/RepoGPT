from langchain_core.prompts import ChatPromptTemplate

from core.providers import get_llm


def answer_question(docs, question, provider, model, api_key):

    context_blocks = []

    for d in docs:

        file_path = d.metadata.get("path", "unknown")

        context_blocks.append(
            f"File: {file_path}\n{d.page_content}"
        )

    context = "\n\n".join(context_blocks)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You explain GitHub repositories using the provided code context."
            ),
            (
                "human",
                "Context:\n{context}\n\nQuestion:\n{question}"
            ),
        ]
    )

    llm = get_llm(provider, model, api_key)

    chain = prompt | llm

    response = chain.invoke(
        {
            "context": context,
            "question": question
        }
    )

    return response.content
