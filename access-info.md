<!-- Note to developer: This is ideally a patterns sheet --> 

# Web Accessibility Guidelines

This document outlines the core accessibility principles to be applied across the codebase. The goal is to ensure all content is perceivable, operable, understandable, and robust for all users, including those with disabilities.

## Key Principles:

1.  **Semantic HTML**: Use HTML elements for their intended purpose. For example, use `<button>` for buttons, `<nav>` for navigation, and `<h1>`-`<h6>` for headings in a logical order. Do not use `<div>` or `<span>` for interactive elements.

2.  **Alternative Text**: All images (`<img>`) must have a descriptive `alt` attribute. If an image is purely decorative, provide an empty `alt=""` attribute.

3.  **Accessible Forms**: All form inputs (`<input>`, `<textarea>`, `<select>`) must have an associated `<label>` element. The `for` attribute of the label must match the `id` of the input. Placeholders are not a substitute for labels.

4.  **ARIA Roles**: Use ARIA (Accessible Rich Internet Applications) attributes only when necessary to enhance accessibility where semantic HTML is insufficient. For instance, add `aria-label` to provide an accessible name for links or buttons that only contain an icon.

5.  **Color Contrast**: Ensure that the contrast ratio between text and its background is sufficient to be readable by people with low vision. The ratio should be at least 4.5:1 for normal text.

6.  **Keyboard Navigation**: All interactive elements, including links, buttons, and form fields, must be focusable and operable using only a keyboard. Ensure focus indicators are clearly visible.
