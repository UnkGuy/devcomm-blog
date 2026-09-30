# Viggy's Archive

**Viggy's Archive** is a fully custom, full-stack digital reliquary and blogging platform built exclusively for the tabletop role-playing community. 

Designed to reject the sterile feel of modern corporate UI, this application features a bespoke dark-fantasy aesthetic with deterministic crinkled parchment layouts, interactive wax seals, and a dynamic masonry noticeboard—built entirely from scratch without the use of generic templates.

---

## About This Project

**Viggy's Archive** was made as a specialized blogging web application with heavy inspiration from tabletop role-playing games (TTRPGs) like Dungeons & Dragons, aiming to capture the tactile magic of physical campaign diaries. The design choice of the masonry feed was taken from platforms like Pinterest to create a dynamic, non-symmetric "Adventurer's Noticeboard" aesthetic. 

A practical demo leveraging Next.js (App Router), Tailwind CSS, and Supabase (Postgres + auth), with deployment to Vercel.

*"We are all scribes of our own campaigns. This archive simply gives those stories a permanent home."*

---

## Tech Stack & Bonus Proficiencies

* **Framework:** Next.js 15 (React 19) utilizing the modern App Router architecture for seamless Server-Side Rendering (SSR) and Client-side hydration.
* **Styling:** Tailwind CSS (Custom configured for a dark-fantasy aesthetic using unique hex palettes and CSS blend modes).
* **Database & Auth:** Supabase (PostgreSQL, GoTrue Auth, Row-Level Security).
* **Rich Text:** TipTap (Headless editor manipulated via custom React extensions).
* **Sanitization:** DOMPurify & Marked (Ensuring safe HTML rendering against XSS attacks).

---

## Security & Web Optimizations

As an application managing user data and server-side logic, enterprise-grade architecture was prioritized:

* **PostgreSQL Row-Level Security (RLS):** Database policies strictly govern data access at the server level. Only authenticated users can INSERT data, and only specific `author_id`s or System Admins can execute UPDATE or DELETE commands.
* **IDOR Prevention:** Server Actions manually verify user session roles and relational database ownership before allowing comment or post deletion, preventing Insecure Direct Object Reference attacks.
* **Concurrent Fetching (SSR Optimization):** Eliminated server-side rendering waterfalls by wrapping independent database queries in `Promise.all()`, cutting Time-to-First-Byte (TTFB) dramatically on heavy feed pages.
* **Algorithmic UI:** Implemented memory-light, mathematical hashing to generate deterministic user avatars (SVG class crests) and dynamic UI textures without relying on heavy external APIs or network requests.
* **Audit Logging:** An administrative system that tracks user logins, logouts, and content mutations via an internal trigger ledger.

---
