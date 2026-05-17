# Understanding React with the SEDES Frontend

Welcome! React can seem like magic at first, but it's really just a set of tools to build user interfaces using Javascript. Since you're already familiar with HTML and JS, you have a great foundation. 

Let's break down how React works using your existing codebase as a real-world example.

---

## 1. Components (The Building Blocks)

You are right! A component is essentially a function that returns the UI (User Interface) for a specific part of your application. You can think of them as custom HTML tags.

In your codebase, you have many components like `Dashboard`, `Home`, and `LoginForm`. 

```jsx
// From src/pages/home/LoginForm.jsx
export default function LoginForm({ onSwitchMode }) {
  // ... logic goes here ...
  return (
    <>
      <div className="logo">SEDES</div>
      <h1 className="form-title">Welcome back.</h1>
      { /* more UI */ }
    </>
  );
}
```

Notice how it starts with `function LoginForm()` and returns what looks like HTML. We can use this component in another file just like an HTML tag: `<LoginForm />`.

You can see this happening in your `Home.jsx`:
```jsx
// From react_guide_sedes.md / src/pages/home/Home.jsx
export default function Home() {
    return (
        <AuthLayout>
            <LoginForm onSwitchMode={setMode} />
        </AuthLayout>
    );
}
```

> [!NOTE]
> Components **must** start with a capital letter (like `LoginForm`, not `loginForm`) so React knows it's a custom component and not a standard HTML tag like `<div>` or `<form>`.

---

## 2. JSX (JavaScript XML)

The HTML-like syntax you see returning from components is called **JSX**. It allows you to write HTML directly inside JavaScript.

The secret power of JSX is that you can inject JavaScript directly into the HTML using curly braces `{}`.

For example, in `Dashboard.jsx`:
```jsx
<div className={`nav-tab ${activeTab === 'encode' ? 'active' : ''}`}>
   Encode
</div>
```
Here, we are using JS inside the `{ ... }` to dynamically add the `active` CSS class *only if* the user is currently on the encode tab.

---

## 3. State (`useState`)

State is how a component "remembers" things. If a variable will change over time and that change needs to update the screen, it must be stored in State. 

You use a special React function called `useState` to do this.

In your `Dashboard.jsx`, you need to remember which tab the user is looking at:
```jsx
// From src/pages/dashboard/Dashboard.jsx
import React, { useState } from 'react';

export default function Dashboard() {
  // activeTab is the variable (defaults to 'encode')
  // setActiveTab is the function to change it
  const [activeTab, setActiveTab] = useState('encode');

  return (
    // If activeTab is 'encode', show <Encode />, otherwise show <Decode />
    {activeTab === 'encode' ? <Encode /> : <Decode />}
  )
}
```

When you call `setActiveTab('decode')`, React automatically notices the state has changed and **re-renders** (updates) the component to show the `<Decode />` screen instead.

In `LoginForm.jsx`, you use state to remember what the user is typing into the inputs:
```jsx
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
```

---

## 4. Events (`onClick`, `onChange`, `onSubmit`)

React handles events very similarly to plain HTML, but they are camelCased (e.g., `onClick` instead of `onclick`), and you pass a JavaScript function inside curly braces.

**Click Events (Dashboard.jsx):**
```jsx
<div onClick={() => setActiveTab('encode')}>
  Encode
</div>
```
When this div is clicked, it runs the arrow function, which updates the state.

**Input Changes (LoginForm.jsx):**
```jsx
<input 
  type="text" 
  onChange={(e) => setUsername(e.target.value)} 
/>
```
Every time the user types a letter, `onChange` fires. `e.target.value` gets the text inside the input, and `setUsername` saves it into React's state.

**Form Submissions (LoginForm.jsx):**
```jsx
<form onSubmit={handleSubmit}>
  {/* inputs here */}
  <button type="submit">Sign In</button>
</form>
```
When the user clicks "Sign In", the `onSubmit` event triggers the `handleSubmit` function you defined.

---

## 5. Props (Passing Data)

Props (short for properties) are how we pass data from a parent component down to a child component. It works exactly like HTML attributes.

In `Home.jsx`, you pass a state-updating function down to the `LoginForm`:
```jsx
// Parent (Home.jsx) passes the setMode function as a prop called "onSwitchMode"
<LoginForm onSwitchMode={setMode} />
```

Then, the `LoginForm` receives it in its parameters and can use it:
```jsx
// Child (LoginForm.jsx) receives "onSwitchMode"
export default function LoginForm({ onSwitchMode }) {
  
  return (
    <p>
      New here? 
      {/* When clicked, it tells the parent Home.jsx to switch to 'signup' */}
      <span onClick={() => onSwitchMode('signup')}>Create an account</span>
    </p>
  )
}
```

---

## 6. Making API Calls (Fetching Data)

In plain HTML/JS, you might use standard JS to make requests. React uses the exact same `fetch` API!

In `LoginForm.jsx`, you have this logic inside `handleSubmit`:
```jsx
const handleSubmit = async (e) => {
  e.preventDefault(); // Stops the page from refreshing

  // Send the state variables (username, password) to the backend
  const res = await fetch("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      user: {value: username}, 
      pt_password: {value: password }
    })
  });

  const data = await res.json();
  
  // If successful, save the token and go to dashboard
  if (res.ok && data.session && data.session.token) {
    localStorage.setItem("sedes_auth_token", data.session.token);
    navigate("/dashboard");
  }
};
```

---

## 7. Routing (`useNavigate` and `<Link>`)

In a traditional website, clicking a link loads a whole new HTML page from the server. In React (specifically a Single Page Application), we just swap out which component is visible on the screen without reloading the page.

You use `react-router-dom` for this.

**Navigating programmatically (LoginForm.jsx):**
When the user logged in successfully, you used a "Hook" called `useNavigate`:
```jsx
import { useNavigate } from "react-router-dom";

// ... inside component ...
const navigate = useNavigate();

// ... after successful login ...
navigate("/dashboard"); // Instantly changes the page to dashboard
```

**Navigating with links (Dashboard.jsx):**
Instead of `<a>`, we use `<Link>` so the page doesn't refresh:
```jsx
import { Link } from 'react-router-dom';

<Link className="nav-logo" to="/">
  SEDES
</Link>
```

> [!TIP]
> **Summary checklist of how your app works:**
> 1. `Home.jsx` loads and shows `LoginForm.jsx`.
> 2. The user types, firing `onChange` to update `useState` variables.
> 3. The user submits the form, firing `onSubmit`.
> 4. `handleSubmit` takes the state, sends it to your backend with `fetch`.
> 5. If successful, `useNavigate` redirects them to `/dashboard`.
> 6. `Dashboard.jsx` loads, using its own `useState` to let the user switch between `Encode.jsx` and `Decode.jsx`.
