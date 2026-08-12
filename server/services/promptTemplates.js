/**
 * Central place for all prompt engineering used by DevPilot AI.
 * Keeping every template in one file makes tone/behavior easy to tune
 * and keeps controllers free of large strings.
 */

const SYSTEM_PROMPT = `You are an expert senior software engineer.
You are analyzing a real software repository.
Use only the provided repository context.
If information is missing, clearly state that.
Explain code clearly and accurately.
Return responses in well-formatted markdown.`;

function buildChatPrompt({ repoName, context, question, sourcesUsed }) {
  return `${SYSTEM_PROMPT}

# Repository
Name: ${repoName}

# Retrieved repository context
The following code snippets were retrieved as the most relevant to the question.
Files referenced: ${sourcesUsed.join(', ') || 'none found'}

${context || '(No relevant context was found in the repository for this question.)'}

# Question
${question}

# Instructions
Answer the question using only the context above. If the context does not contain
enough information to fully answer, say so explicitly rather than guessing.`;
}

function buildReadmePrompt({ repoName, context, fileTreeSummary }) {
  return `${SYSTEM_PROMPT}

# Repository
Name: ${repoName}

# File structure (top-level overview)
${fileTreeSummary}

# Repository context (representative code excerpts)
${context}

# Task
Generate a complete, professional README.md for this repository in markdown format.
Include exactly these sections, in this order, using level-2 headings ("## Section"):
1. Project title (level 1 heading "# ${repoName}") followed by a one-line tagline
2. Description
3. Features
4. Tech Stack
5. Installation
6. Usage
7. Folder Structure
8. API Endpoints (if this looks like a backend/API project; otherwise state there are none)
9. Contributing
10. License

Base every claim strictly on the provided context. If something cannot be determined
from the context (e.g. the license), say so plainly instead of inventing details.
Return ONLY the markdown content, with no surrounding commentary.`;
}

function buildApiDocsPrompt({ repoName, context }) {
  return `${SYSTEM_PROMPT}

# Repository
Name: ${repoName}

# Repository context (route/controller excerpts)
${context}

# Task
Generate markdown API documentation for every Express (or similar) route you can find
in the context above. For each endpoint include:
- **Method** (GET/POST/PUT/DELETE/etc.)
- **Path**
- **Request body** (fields and types, or "None")
- **Response** (shape/example)
- **Authentication requirement** (Yes/No, and how it's enforced if visible)

Group endpoints under level-2 headings by resource/router (e.g. "## Auth", "## Repositories").
If no routes are found in the context, clearly state that no API routes could be identified.
Return ONLY the markdown content, with no surrounding commentary.`;
}

function buildBugFinderPrompt({ repoName, context }) {
  return `${SYSTEM_PROMPT}

# Repository
Name: ${repoName}

# Repository context (code excerpts)
${context}

# Task
Perform a static-analysis-style review of the provided code context and produce a markdown
report with the following level-2 sections:
1. **Potential Bugs** - logic errors, edge cases, off-by-one errors, unhandled promise rejections, etc.
2. **Dead Code** - unused functions/variables/exports you can identify from context.
3. **Duplicate Logic** - repeated code that could be refactored into shared utilities.
4. **Large Files** - files that appear unusually large or doing too much (mention file paths).
5. **Missing Validation** - inputs that are used without validation/sanitization.
6. **Error Handling Improvements** - places where errors are swallowed, not caught, or poorly reported.
7. **Security Concerns** - hardcoded secrets, injection risks, unsafe deserialization, missing auth checks, etc.

For every finding, include:
- The file path (and line/function name if identifiable from context)
- A short explanation
- A **Severity** rating: Critical, High, Medium, or Low

If the context is insufficient to assess a category, state that explicitly rather than
inventing issues. Return ONLY the markdown content, with no surrounding commentary.`;
}

function buildSummaryPrompt({ repoName, context }) {
  return `${SYSTEM_PROMPT}

# Repository
Name: ${repoName}

# Repository context
${context}

# Task
Summarize what this repository does, its architecture, and how to run it, based only on
the provided context. Return well-formatted markdown.`;
}

module.exports = {
  SYSTEM_PROMPT,
  buildChatPrompt,
  buildReadmePrompt,
  buildApiDocsPrompt,
  buildBugFinderPrompt,
  buildSummaryPrompt,
};
