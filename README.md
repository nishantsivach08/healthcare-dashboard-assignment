# Authorization Management Dashboard

## Setup

### Prerequisites
- Node.js 20+
- Yarn 1.22+
- Angular 21

### Install & Run

```bash
# install dependencies
yarn install

# start development server
yarn start
```

Open the app at:

```
http://localhost:4200
```

### Build

```bash
yarn build
```

---

# Key Configuration

### PostCSS (for Tailwind)

Create `postcss.config.json` in the project root.

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

---

### HttpClient Configuration

Enable fetch-based HTTP in `app.config.ts`:

```ts
provideHttpClient(withFetch())
```

---

### Material Icons + Global Styles

Add this to the top of `styles.css`:

```css
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import 'tailwindcss';
@import '@angular/material/prebuilt-themes/azure-blue.css';
```

---

# Architecture Overview

### Tailwind v4 Configuration
The project uses the CSS-first Tailwind v4 approach.  
Theme tokens and custom styles are defined in `styles.css` using the `@theme` block instead of a `tailwind.config.ts`.

---

### Angular Signals for State
Component state uses Angular Signals (`signal`, `computed`) instead of RxJS streams.  
Signals handle filtering, sorting, and UI updates with minimal boilerplate.

---

### Filter Bar Component
The filter UI is implemented in a separate component:

```
RequestFilterBarComponent
```

This component emits a `FilterState` object while the table component applies filtering and sorting logic.

---

### Responsive Layout

Two layouts are used:

**Desktop**
- `mat-table`
- expandable rows with inline detail panel

**Mobile**
- card-based layout
- expandable details

This avoids horizontal scrolling on smaller screens.

---

### Angular Material + Tailwind

Angular Material provides complex UI components:

- tables
- selects
- datepickers
- menus
- slide toggles

Tailwind handles layout, spacing, and custom styling.

---


### Data Loading

Data is loaded through the `AuthorizationService` when the dashboard initializes.
