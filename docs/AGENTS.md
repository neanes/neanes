# Documentation guidance

Neanes documentation is a user manual for scorewriters, not developer documentation or a technical specification.

- Write for users trying to complete a task.
- Explain what a feature does, when to use it, and how to use it.
- Prefer common workflows and practical examples.
- Avoid implementation details, internal data behavior, exhaustive limits, validation mechanics, and fallback rules unless users need them.
- Group advanced controls into broad categories when individual details do not help users complete a task.
- Use the labels and terminology shown in the application.
- Do not create or add screenshots unless the user explicitly asks for them.
- Use screenshots only when they materially clarify the interface.
- In annotated screenshots, number major interface regions. Refer to toolbar actions by their actual icons and labeled buttons by their visible text.
- Keep explanations concise and avoid narrating obvious interface behavior, such as telling users to scroll.
- Limit changes to the requested documentation unless a related navigation link or cross-reference must be updated.
- Verify documented behavior against the implementation and run `npm run docs:build` before finishing.
