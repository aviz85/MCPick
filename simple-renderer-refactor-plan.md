# תכנית ריפקטור מלאה ל-`simple-renderer.js`

הקובץ הנוכחי (≈1,200 LOC) מבצע הכול ידנית:
- יצירת HTML בתור template-strings,
- הזרקת event-listeners,
- טיפול ב-state גלובלי דרך ה-DOM,
- קריאות IPC ל-Electron דרך `window.api`.

לכן קשה לתחזק, לבדוק ולשנות. המעבר ל-React יפריד תצוגה-לוגיקה-state, יקצר קוד, וימנע שכפולים.

## התרשים הכללי

```
src/renderer/
  └─ api/            // עטיפות ל-window.api
  └─ components/     // כל קומפוננטה ב-tsx
  └─ context/        // Providers ל-servers + sets + config + errors
  └─ hooks/          // useServers, useServerSets, useConfig, useMask
  └─ pages/          // Tabs ראשיים: ServersPage, SetsPage
  └─ utils/          // isNpmPackage, maskSensitiveValue ...
  └─ App.tsx         // Router + Layout
  └─ index.tsx       // bootstrap + ErrorBoundary
```

## זרימת פעולה (High-level Flow)

1. בעת `DOMContentLoaded` React מרנדר `App`.
2. `App` טוען סטטוס אפליקציה (`getAppStatus`).
   - אם אין קובץ קונפיג – מוצג מסך “Browse…”.
   - אם יש – מוצגים Tabs “Servers / Sets”.
3. Provider → `ServersContext` קורא `getServers` ומכיל CRUD: save / toggle / delete.  
   `SetsContext` דומה (`getServerSets`, `applyServerSet`).
4. כל טופס (הוספה/עריכה/Parse JSON) רץ כ-Modal (React-Portal) עם ולידציה סינכרונית. שמירה → קריאה ל-API → ניהול state גלובלי → סגירת modal.
5. הסתרת ערכים רגישים נעשית ע"י hook `useMask` שעוטף את המיתר המקורי ומחזיר `{ maskedValue, isMasked, toggle }`.
6. `ErrorBoundary` עוטף את האפליקציה; שגיאות מוצגות בקומפוננטת `<ErrorBox>`.
7. Styling – או CSS-Modules, או MUI/Chakra; כאן נניח CSS-Modules פשוט.
8. כל הקוד הישן ב-`simple-renderer.js` נמחק; קבצי HTML/JS ישנים מוסרים.

## שלבי ביצוע מפורטים

### 0. הכנה

1. הסר קבצים/קומפוננטות ישנים שלא ייקראו עוד (`simple-renderer.js`, HTML ישן).
2. התקן React + React-DOM + TypeScript (או JS) בתוך חבילת ה-renderer:
   ```bash
   npm install react react-dom
   npm install -D typescript @types/react @types/react-dom
   ```
3. הגדר Webpack/Vite ל-Electron-renderer (אם אינו קיים).

### 1. API Layer

`src/renderer/api/ipc.ts`
```ts
export const api = {
  browseConfigFile: () => window.api.browseConfigFile(),
  getAppStatus:     () => window.api.getAppStatus(),
  getServers:       () => window.api.getServers(),
  saveServer:       (name, cfg) => window.api.saveServer(name, cfg),
  toggleServer:     (name, enabled) => window.api.toggleServer(name, enabled),
  deleteServer:     (name) => window.api.deleteServer(name),
  getServerSets:    () => window.api.getServerSets(),
  saveServerSet:    (id, cfg) => window.api.saveServerSet(id, cfg),
  applyServerSet:   (id) => window.api.applyServerSet(id),
  deleteServerSet:  (id) => window.api.deleteServerSet(id),
};
```

### 2. Utilities

העבר לפנים `utils/mask.ts` את הפונקציות `maskSensitiveValue`, `isNpmPackage`, `isFilePath`, וכתוב עבורן בדיקות ב-Jest.

### 3. Context & Hooks

- `ServersProvider`: לטעינת שרתים, exposes:
  ```ts
  servers, reload(), save(name, data), toggle(name, enabled), remove(name)
  ```
- `SetsProvider`: דומה ל-sets.
- `ConfigProvider`: שומר `configPath` ו-`configExists`, מתעדכן באירוע browse.
- חבר hooks: `useServers`, `useServerSets`, `useConfig`, `useMask`.

### 4. Component Hierarchy

```jsx
<App>
  <Header />
  {!config.exists ? <ConfigSelector /> :
    <Tabs>
      <ServersPage />
      <SetsPage />
    </Tabs>}
  <ModalHost />   {/* React-Portal */}
</App>
```

`ServersPage`:
```jsx
<ServerToolbar onParse onAdd />
<ServerList>
  <ServerItem />   {/* שם, פקודה, reveal toggle, switch, edit/delete */}
</ServerList>
```
Dialogs:
- `<ServerFormDialog />`
- `<ParseConfigDialog />`

`SetsPage`:
```jsx
<SetToolbar onAdd />
<SetList>
  <SetItem />  {/* Highlight active */}
</SetList>
```
Dialog: `<SetFormDialog />`

### 5. Styling

- CSS-Modules (או styled-components).
- ערכת צבעים: #1976d2 כחול ראשי, #4caf50 ירוק, #dc004e אדום.
- קומפוננטת Toggle-Switch ושימוש חוזר לכפתורים.

### 6. Error Handling

השתמש ב-`ErrorBoundary` שמציג `<ErrorBox>` עם stack ו-message (המשך מ-simple).

### 7. Modal Implementation

```ts
const modalRoot = document.getElementById('modal-root');
createPortal(<div className="overlay">...</div>, modalRoot);
```

### 8. Form Validation

- השתמש ב-Yup או ב-hand-rolled.
- הצגת שגיאות אינליין, לא `alert`.

### 9. Sensitive-Mask Hook

```ts
function useMask(value: string) {
  const [masked, setMasked] = useState(true);
  const maskedValue = useMemo(
    () => masked ? maskSensitiveValue(value) : value,
    [masked, value]
  );
  return { maskedValue, masked, toggle: () => setMasked(!masked) };
}
```

### 10. Active Set Detection

בחישוב בתוך `SetsProvider`:
1. אסוף שרתים עם `enabled === true`.
2. מצא set שה-`servers` שלו זהים ל-enabled servers.

### 11. Tests

- בדיקות ל-`maskSensitiveValue`.
- בדיקות ל-Providers (mock API).
- בדיקות לטפסים ב-React Testing Library.

### 12. Build & Integration

- עדכן ל-main-process לטעון את ה-`index.html` שנבנה מ-React.
- הסר `<script src="simple-renderer.js">` מה-HTML.

### 13. ניקיון קוד ישן

- מחק `simple-renderer.js`.
- הסר קומפוננטות/קבצים ישנים.
- עדכן `preload.ts` לשמר whitelist ל-IPC.

## ציר זמן מומלץ

1. Setup React/TS + Webpack/Vite (½ יום)  
2. העברת utilities + API layer (½ יום)  
3. Context & providers (1 יום)  
4. קומפוננטות בסיס (`Header`/`Tabs`/`ErrorBoundary`) (½ יום)  
5. Servers flow: Toolbar, List, Item, Dialogs (1½ יום)  
6. Sets flow + Active-state (1 יום)  
7. Mask hook + טפסים + ולידציה (½ יום)  
8. Styling + responsive + Polish (½ יום)  
9. Tests + cleanup (½ יום)  
> **סה"כ ≈7 ימי עבודה**

## הנחיות העברה למפתח

1. עקוב אחרי שלבי הביצוע בסדר המוצע.
2. כל commit לטפל בחלק פונקציונלי יחיד (Context, Servers, Sets …).
3. ודא שכל Provider מכיל `reload` שניתן לקרוא לו מבחוץ.
4. הימנע מ-`any`, העדף TypeScript מלא עם ממשקים:
   ```ts
   interface ServerConfig {
     command: string;
     args: string[];
     enabled: boolean;
     env?: Record<string,string>;
   }
   interface ServerSet {
     name: string;
     description: string;
     prompt: string;
     servers: string[];
   }
   ```
5. שמור על עקביות קוד (ESLint + Prettier).
6. ב-main-process של Electron – אל תשנה שמות IPC; Providers ישתמשו בשכבת `api`.
