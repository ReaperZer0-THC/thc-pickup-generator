# THC Discord Order Bot (MVP)

A Discord-native order checklist prototype. Lives in each customer order thread; staff use select menus to advance individual item statuses. SQLite stores progress.

## Setup

1. Create a Discord application and bot at the Discord Developer Portal.
2. Enable **Message Content Intent** (required for reading order text) and invite the bot with View Channel, Read Message History, Send Messages, Embed Links, and Use Application Commands permissions in the chosen forum.
3. Install Python 3.11+, then `pip install -r requirements.txt`.
4. Copy `.env.example` to `.env`, set `DISCORD_TOKEN`, `ORDER_FORUM_IDS`, and `STAFF_ROLE_IDS`. Never commit the real token.
5. Run `python bot.py` from the `order-bot` directory.

## Behavior

- New forum threads are scanned for catalog-matching creature names. The bot creates a checklist message in the thread.
- Use `/import_order` inside an existing order thread to import its starter message. Existing threads are **not** automatically backfilled.
- Use the checklist dropdown to choose an item, then advance its status with the button.
- Use `/order_refresh` to re-parse an edited starter message. Refresh preserves existing items with matching names and occurrence numbers, but removed items are dropped; review before using on heavily edited orders.
- `/order_status` shows saved status.

## Limitations and safeguards

- **Starter catalog only:** verify and replace `catalog.json` with the authoritative Alpha list before production.
- Parser uses exact catalog-name phrase matching; ambiguous aliases and spelling mistakes require staff review. It does not infer quantities like 'pair' or 'x2' yet.
- The bot ignores other bots and operates only in configured forums. Staff roles control mutations; members can view checklist messages.
- Message-content intent may require Discord approval for larger verified bots.
- A running host is required. GitHub stores code but does not keep the bot online.
- SQLite must be on persistent storage; back up the database. Do not commit the database or .env.
- MVP does not send DMs, automate payments, or enforce pickup deadlines.
