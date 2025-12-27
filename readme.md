<h1 align="center" id="title">Real-Time Chat Application</h1>

<p align="center"><img src="https://socialify.git.ci/ArhammJain/Realtime-Chat/image?description=1&font=Inter&forks=1&issues=1&language=1&name=1&owner=1&pattern=Solid&stargazers=1&theme=Dark" alt="Realtime-Chat" width="640" height="320" /></p>

<p id="description">A scalable, production ready messaging system built with Next.js & Supabase. Designed like a real product, not a tutorial. Features architecture first design with clean relational database structure, real time messaging capabilities, and a modern Gray-50 aesthetic that prioritizes user experience.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge">
</p>

<h2>🚀 Demo</h2>

[Project Preview](https://realtimechatbyarham.vercel.app/login) <!-- Replace with your actual demo link -->

<h2>✨ Key Features</h2>

Here are some of the project's best features:

*   **Real-Time Messaging** - Instant message delivery using Supabase subscriptions
*   **Live Typing Indicators** - See when others are typing with smooth animations
*   **User Authentication** - Secure signup/login with JWT and cookie sessions
*   **User Discovery** - Search and find registered users by username
*   **Profile Management** - Upload and update profile avatars
*   **One-to-One & Group Chats** - Flexible conversation architecture
*   **Responsive Design** - Custom sidebar that transforms into mobile drawer
*   **Clean Gray-50 UI** - Minimalist aesthetic with Monday Blues accents
*   **Production-Ready Schema** - Normalized database with proper foreign keys
*   **API-First Architecture** - Business logic separated from UI components
*   **Scalable Infrastructure** - Built to handle thousands of users
*   **Zero UI Libraries** - Handcrafted CSS for full control and performance

<h2>🎯 Why This Project Exists</h2>

Most chat apps online are glorified demos with hardcoded users and no real database design.

This one is **architecture-first**.

I built this to deeply understand how production messaging systems work, focusing on:

- **Clean relational database design** – Normalized schema with proper foreign keys and constraints
- **Scalable conversation models** – Built to handle one-to-one chats, group conversations, and future features
- **Production-style API separation** – Business logic lives in API routes, not components
- **Real-world extensibility** – The schema supports read receipts, typing indicators, and media messages without refactoring

> Built to scale — not hack together.

<h2>🛠️ Installation Steps</h2>

<p>1. Clone the Repository</p>

```bash
git clone https://github.com/ArhammJain/Realtime-Chat.git
cd Realtime-Chat
```

<p>2. Install Dependencies</p>

```bash
npm install
# or
yarn install
# or
pnpm install
```

<p>3. Set Up Environment Variables</p>

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the `URL` and `anon` key for client-side
- Copy the `service_role` key for server-side operations (keep this secret!)

<p>4. Set Up Database Schema</p>

Run the following SQL in your Supabase SQL editor (in this exact order):

```sql
-- 1. Users table (application-level authentication)
CREATE SEQUENCE users_id_seq;

CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  avatar text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- 2. Profiles table (linked to Supabase auth)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  avatar text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- 3. Conversations table
CREATE SEQUENCE conversations_id_seq;

CREATE TABLE public.conversations (
  id bigint NOT NULL DEFAULT nextval('conversations_id_seq'::regclass),
  name text,
  is_group boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- 4. Participants table (many-to-many: users ↔ conversations)
CREATE SEQUENCE participants_id_seq;

CREATE TABLE public.participants (
  id bigint NOT NULL DEFAULT nextval('participants_id_seq'::regclass),
  conversation_id bigint NOT NULL,
  user_id bigint NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT participants_pkey PRIMARY KEY (id),
  CONSTRAINT participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 5. Messages table
CREATE SEQUENCE messages_id_seq;

CREATE TABLE public.messages (
  id bigint NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
  conversation_id bigint NOT NULL,
  sender_id bigint,
  content text,
  type text DEFAULT 'text'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);

-- 6. Create indexes for query performance
CREATE INDEX idx_participants_conversation ON public.participants(conversation_id);
CREATE INDEX idx_participants_user ON public.participants(user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_profiles_username ON public.profiles(username);
```

<p>5. Run the Development Server</p>

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

<h2>🏗️ Project Structure</h2>

```
realtime-chat/
├── pages/
│   ├── index.js                   # Landing page
│   ├── login.js                   # Authentication UI
│   ├── signup.js                  # Registration flow
│   ├── chat.js                    # Main chat interface
│   └── api/
│       ├── auth/
│       │   ├── login.js           # Login endpoint
│       │   ├── signup.js          # Registration endpoint
│       │   └── logout.js          # Session termination
│       ├── conversations/
│       │   ├── create.js          # New conversation
│       │   ├── list.js            # User's conversations
│       │   └── get.js             # Single conversation details
│       ├── messages/
│       │   ├── send.js            # Send new message
│       │   └── get.js             # Fetch conversation messages
│       └── users/
│           ├── search.js          # Find users by username
│           └── profile.js         # Get/update profile
├── components/
│   ├── Sidebar.tsx                # Conversations list
│   ├── ChatWindow.tsx             # Message display area
│   ├── MessageInput.tsx           # Compose new messages
│   └── UserSearch.tsx             # Search users component
├── utils/
│   ├── supabase.js                # Supabase client config
│   └── auth.js                    # Auth helpers
└── public/
    └── ...                        # Static assets
```

<h2>🔧 Technologies Used</h2>

**Frontend:**
- **Next.js** (Pages Router) - React framework with SSR
- **React** - Component-based UI architecture
- **Styled JSX** - Scoped CSS for component styling
- **Custom CSS** - Handcrafted styles for full control

**Backend:**
- **Next.js API Routes** - Serverless backend functions
- **Supabase Admin SDK** - Server-side database operations
- **Supabase Client** - Client-side realtime subscriptions

**Database:**
- **PostgreSQL** (via Supabase) - Fully normalized relational database
- **Row Level Security** - Fine-grained access control
- **Realtime Subscriptions** - Database changes streamed to clients

**Authentication:**
- **Supabase Auth** - JWT-based authentication
- **Cookie Sessions** - Secure session management
- **Custom User Table** - Application-level user data

**Deployment:**
- **Vercel** - Hosting and deployment platform

<h2>🗄️ Database Design (The Core Strength)</h2>

This is where most chat apps fail. Here's why this schema is production-ready:

### `users`
```sql
id (bigint, auto-increment), username (unique), password_hash, avatar, created_at
```
Stores application-level users with custom authentication logic. Uses bigint for scalability.

### `profiles`
```sql
id (uuid, FK → auth.users), username (unique), avatar, created_at
```
Public-facing profile data mapped to Supabase auth users. This dual-table approach separates authentication from public user data.

### `conversations`
```sql
id (bigint, auto-increment), name, is_group (boolean), created_at
```
Represents chat rooms. The `is_group` flag enables both one-to-one and group chats with the same table structure.

### `participants`
```sql
id (bigint), conversation_id (FK), user_id (FK), joined_at
```
Many-to-many mapping between users and conversations. This is the key to supporting group chats without denormalization.

### `messages`
```sql
id (bigint), conversation_id (FK), sender_id (FK), content, type, created_at
```
Stores all messages. The `type` field (`text` by default) makes it trivial to add support for `image`, `file`, or `audio` messages later.

### Why This Schema Scales

- **Group chat ready** – Just add more rows to `participants`, no refactor needed
- **Read receipts** – Add a `message_receipts` table: `(message_id, user_id, read_at)`
- **Typing indicators** – Track via Supabase Presence or add a `typing_status` table
- **Media messages** – Already supported via the `type` field, just implement file storage
- **Message reactions** – Add a `reactions` table: `(message_id, user_id, emoji, created_at)`
- **Indexed queries** – Six strategic indexes ensure fast lookups for conversations, messages, and user searches

> This isn't a tutorial schema. It's designed for real-world scale.

<h2>🧠 Architecture Overview</h2>

```
Frontend (Next.js)
    ↓
API Routes (REST)
    ↓
Supabase Admin / Client SDK
    ↓
PostgreSQL (Relational Schema)
```

This layered architecture enables:

- **Easy Migration** – Switch to WebSockets or Supabase Realtime without touching the UI
- **Secure Database Access** – Server-side operations use service role keys, client uses RLS
- **Independent Scaling** – Frontend and backend can scale separately
- **Testability** – API routes can be unit tested independently

<h2>🔄 Application Flow</h2>

1. **User authenticates** via `/api/auth/login` or `/api/auth/signup`
2. **Conversations are fetched** via `/api/conversations/list`
3. **Participants are resolved** to show who's in each conversation
4. **Messages are retrieved** per conversation via `/api/messages/get`
5. **New messages are inserted** via `/api/messages/send`
6. **UI updates** (currently via polling, realtime coming soon)

<h2>🎨 Design Philosophy</h2>

This project deliberately avoids heavy UI component libraries. Every style is handcrafted to ensure:

- **Full Control** – Complete ownership over visual hierarchy and responsive behavior
- **Performance** – Minimal CSS bundle size with no unused styles
- **Consistency** – A cohesive design language throughout the application
- **Modern Aesthetic** – Generous whitespace and subtle shadows create a "floaty" feel

The Gray-50 palette keeps the interface neutral and professional, while Monday Blues accents guide user attention to interactive elements.

<h2>🚦 Usage</h2>

1. **Sign Up or Login**
   - Create a new account or login with existing credentials
   - Your session is securely managed with JWT tokens

2. **Search for Users**
   - Use the search bar to find other registered users
   - Click on a user to start a conversation

3. **Send Messages**
   - Type your message in the input field
   - Press Enter or click Send to deliver instantly
   - See live typing indicators when others are composing

4. **Manage Conversations**
   - All your chats appear in the sidebar
   - Click any conversation to view message history
   - Conversations update in real-time

<h2>🐛 Known Issues & Troubleshooting</h2>

**"Authentication failed"**
- Verify your `.env.local` file has correct Supabase credentials
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set for server-side operations

**"Messages not appearing"**
- Check that the database schema was created correctly
- Verify foreign key relationships are in place
- Ensure indexes were created for performance

**"Can't find users"**
- Make sure users are registered in the `users` table
- Check that usernames are unique and searchable

**Database connection issues**
- Verify your Supabase project is active
- Check that Row Level Security policies allow read/write access
- Ensure API keys haven't expired

<h2>🔮 Roadmap</h2>

- [ ] **Realtime messaging** – Migrate to Supabase Realtime or WebSockets
- [ ] **Typing indicators** – Show when users are composing messages
- [ ] **Read & delivery receipts** – Track message status
- [ ] **Media messages** – Support images, files, and voice notes
- [ ] **Online presence** – Show who's currently active
- [ ] **Message search** – Full-text search across conversations
- [ ] **Push notifications** – Web Push API for new messages
- [ ] **Message editing/deletion** – With edit history tracking
- [ ] **End-to-end encryption** – Signal Protocol implementation

<h2>🤝 Contributing</h2>

Contributions are welcome, especially for:

- **Performance improvements** – Query optimization, caching strategies
- **Schema enhancements** – Better normalization or new features
- **Realtime integration** – WebSocket or Supabase Realtime implementation
- **Testing** – Unit tests for API routes and integration tests

If you're improving the architecture, I'm all ears.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request with a detailed description

<h2>📝 License</h2>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<h2>🙏 Acknowledgments</h2>

- **Supabase** – For making PostgreSQL feel like magic
- **Next.js** – For the best React framework out there
- **Vercel** – For seamless deployments
- **PostgreSQL** – For rock-solid relational database foundation

<h2>👨‍💻 Author</h2>

**Arham Jain**
- GitHub: [@ArhammJain](https://github.com/ArhammJain)
- Instagram: [arham.builds](https://instagram.com/arham.builds)

<h2>⭐ Star History</h2>

If you find this project useful, please consider giving it a star! ⭐

---

<p align="center">Built with care to understand real time systems from the ground up.</p>
<p align="center">Follow @arham.builds on Instagram</p>
