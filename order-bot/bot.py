import asyncio
import json
import os
import re
import sqlite3
from pathlib import Path

import discord
from discord import app_commands
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
FORUMS = {int(x) for x in os.getenv("ORDER_FORUM_IDS", "").split(",") if x.strip().isdigit()}
STAFF = {int(x) for x in os.getenv("STAFF_ROLE_IDS", "").split(",") if x.strip().isdigit()}
DB_PATH = os.getenv("DATABASE_PATH", "orders.sqlite3")
CATALOG = sorted(json.loads(Path(__file__).with_name("catalog.json").read_text()), key=str.casefold)
STATES = ["Pending", "Breeding", "Ready", "Completed"]
db = sqlite3.connect(DB_PATH)
db.row_factory = sqlite3.Row
db.executescript("""
CREATE TABLE IF NOT EXISTS orders(
 thread_id INTEGER PRIMARY KEY, source_id INTEGER NOT NULL,
 checklist_id INTEGER, customer_id INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS items(
 thread_id INTEGER NOT NULL, ordinal INTEGER NOT NULL,
 name TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'Pending',
 PRIMARY KEY(thread_id, ordinal));
""")
db.commit()

def parse_items(content):
    # Longest phrases first avoids overlapping catalog names.
    matches = []
    for name in sorted(CATALOG, key=len, reverse=True):
        pattern = r"(?<!\\w)" + re.escape(name) + r"(?!\\w)"
        for match in re.finditer(pattern, content, flags=re.I):
            if not any(match.start() < end and match.end() > start for start, end in matches):
                matches.append((match.start(), match.end(), name))
    return [m[2] for m in sorted(matches)]

def is_order_thread(channel):
    return isinstance(channel, discord.Thread) and channel.parent_id in FORUMS

def staff_only(interaction):
    return bool(STAFF.intersection(r.id for r in getattr(interaction.user, "roles", []))) or interaction.user.guild_permissions.manage_guild

def get_items(thread_id):
    return db.execute("SELECT * FROM items WHERE thread_id=? ORDER BY ordinal", (thread_id,)).fetchall()

def embed_for(thread_id):
    items = get_items(thread_id)
    done = sum(i["state"] == "Completed" for i in items)
    e = discord.Embed(title="THC • Order Checklist", description=f"**{done}/{len(items)} completed**\\nSelect an item below to update its status.", color=0x237849)
    for start in range(0, len(items), 15):
        block = items[start:start+15]
        e.add_field(name=f"Items {start+1}–{start+len(block)}", value="\\n".join(f"`{i['ordinal']+1:02}` {i['name']} — **{i['state']}**" for i in block)[:1024], inline=False)
    if not items:
        e.description = "No recognized catalog dinosaurs. Staff should review the original post."
    return e

class Checklist(discord.ui.View):
    def __init__(self, thread_id, page=0):
        super().__init__(timeout=None)
        self.thread_id = thread_id
        self.page = page
        items = get_items(thread_id)
        self.pages = max(1, (len(items)+24)//25)
        segment = items[page*25:(page+1)*25]
        if segment:
            select = discord.ui.Select(
                placeholder=f"Choose item • page {page+1}/{self.pages}",
                options=[discord.SelectOption(label=f"{i['ordinal']+1}. {i['name']}"[:100], description=i["state"], value=str(i["ordinal"])) for i in segment],
                custom_id=f"thc:select:{thread_id}:{page}"
            )
            async def chosen(interaction):
                if not staff_only(interaction):
                    return await interaction.response.send_message("Staff only.", ephemeral=True)
                ordinal = int(select.values[0])
                item = db.execute("SELECT * FROM items WHERE thread_id=? AND ordinal=?", (thread_id, ordinal)).fetchone()
                await interaction.response.send_message(f"**{item['name']}** is {item['state']}. Choose its new status:", view=StatusPicker(thread_id, ordinal), ephemeral=True)
            select.callback = chosen
            self.add_item(select)
        if self.pages > 1:
            for label, offset in [("Previous", -1), ("Next", 1)]:
                button = discord.ui.Button(label=label, style=discord.ButtonStyle.secondary, disabled=not 0 <= page+offset < self.pages, custom_id=f"thc:page:{thread_id}:{page}:{offset}")
                async def turn(interaction, dest=page+offset):
                    await interaction.response.edit_message(view=Checklist(thread_id, dest))
                button.callback = turn
                self.add_item(button)

class StatusPicker(discord.ui.View):
    def __init__(self, thread_id, ordinal):
        super().__init__(timeout=180)
        for state in STATES + ["On Hold", "Canceled"]:
            button = discord.ui.Button(label=state, style=discord.ButtonStyle.secondary)
            async def change(interaction, selected=state):
                if not staff_only(interaction):
                    return await interaction.response.send_message("Staff only.", ephemeral=True)
                db.execute("UPDATE items SET state=? WHERE thread_id=? AND ordinal=?", (selected, thread_id, ordinal))
                db.commit()
                await update_checklist(interaction.client, thread_id)
                await interaction.response.edit_message(content=f"Updated item {ordinal+1} to **{selected}**.", view=None)
            button.callback = change
            self.add_item(button)

async def update_checklist(client, thread_id):
    order = db.execute("SELECT * FROM orders WHERE thread_id=?", (thread_id,)).fetchone()
    if not order:
        return
    channel = client.get_channel(thread_id) or await client.fetch_channel(thread_id)
    if order["checklist_id"]:
        try:
            msg = await channel.fetch_message(order["checklist_id"])
            await msg.edit(embed=embed_for(thread_id), view=Checklist(thread_id))
            return
        except discord.NotFound:
            pass
    msg = await channel.send(embed=embed_for(thread_id), view=Checklist(thread_id))
    db.execute("UPDATE orders SET checklist_id=? WHERE thread_id=?", (msg.id, thread_id))
    db.commit()

async def import_thread(client, thread, refresh=False):
    source = None
    try:
        source = await thread.fetch_message(thread.id)
    except discord.NotFound:
        async for message in thread.history(limit=100, oldest_first=True):
            if not message.author.bot:
                source = message
                break
    if source is None:
        raise ValueError("No starter message found.")
    names = parse_items(source.content)
    old = get_items(thread.id)
    # Match by name and occurrence, preserving statuses when re-parsing.
    buckets = {}
    for item in old:
        buckets.setdefault(item["name"], []).append(item["state"])
    db.execute("INSERT INTO orders(thread_id,source_id,customer_id) VALUES(?,?,?) ON CONFLICT(thread_id) DO UPDATE SET source_id=excluded.source_id", (thread.id, source.id, source.author.id))
    db.execute("DELETE FROM items WHERE thread_id=?", (thread.id,))
    for n, name in enumerate(names):
        states = buckets.get(name, [])
        state = states.pop(0) if states else "Pending"
        db.execute("INSERT INTO items(thread_id,ordinal,name,state) VALUES(?,?,?,?)", (thread.id,n,name,state))
    db.commit()
    await update_checklist(client, thread.id)
    return len(names)

class Bot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)
    async def setup_hook(self):
        await self.tree.sync()
    async def on_thread_create(self, thread):
        if is_order_thread(thread):
            await asyncio.sleep(2)
            try:
                await import_thread(self, thread)
            except (discord.HTTPException, ValueError) as exc:
                print("Import failed:", exc)
    async def on_ready(self):
        # Register persistent views for existing checklists after restart.
        for row in db.execute("SELECT thread_id,checklist_id FROM orders WHERE checklist_id IS NOT NULL"):
            self.add_view(Checklist(row["thread_id"]), message_id=row["checklist_id"])
        print(f"THC bot online: {self.user}")

bot = Bot()

@bot.tree.command(name="import_order", description="Import an existing order thread into the checklist")
async def import_order(interaction: discord.Interaction):
    if not is_order_thread(interaction.channel) or not staff_only(interaction):
        return await interaction.response.send_message("Staff only, inside an approved order thread.", ephemeral=True)
    await interaction.response.defer(ephemeral=True)
    count = await import_thread(bot, interaction.channel)
    await interaction.followup.send(f"Checklist imported: {count} recognized entries.", ephemeral=True)

@bot.tree.command(name="order_refresh", description="Manually re-parse the original order; preserves matching item statuses")
async def order_refresh(interaction: discord.Interaction):
    if not is_order_thread(interaction.channel) or not staff_only(interaction):
        return await interaction.response.send_message("Staff only, inside an approved order thread.", ephemeral=True)
    await interaction.response.defer(ephemeral=True)
    count = await import_thread(bot, interaction.channel, refresh=True)
    await interaction.followup.send(f"Refreshed {count} entries. Review any removed or changed items.", ephemeral=True)

class TextImportModal(discord.ui.Modal, title="Import THC Order"):
    order_text = discord.ui.TextInput(label="Paste customer order", style=discord.TextStyle.paragraph, required=True, max_length=4000)
    async def on_submit(self, interaction: discord.Interaction):
        names = parse_items(str(self.order_text))
        if not names:
            return await interaction.response.send_message("No catalog matches found. Check the names or update the catalog.", ephemeral=True)
        # Preview first; no existing order data is overwritten.
        preview = "\\n".join(f"• {name}" for name in names[:35])
        if len(names) > 35:
            preview += f"\\n...and {len(names)-35} more"
        await interaction.response.send_message(
            f"**Import preview — not saved**\\n{preview}\\n\\nThis parser does not yet interpret pairs, sex, or quantities. Review the original text before using this as an order.",
            ephemeral=True
        )

@bot.tree.command(name="order_import", description="Paste an order and preview recognized dinosaurs")
async def order_import(interaction: discord.Interaction):
    if not is_order_thread(interaction.channel) or not staff_only(interaction):
        return await interaction.response.send_message("Staff only, inside an approved order thread.", ephemeral=True)
    await interaction.response.send_modal(TextImportModal())

@bot.tree.command(name="order_import_image", description="Attach a screenshot for manual review (OCR not configured yet)")
@app_commands.describe(image="Image containing the order")
async def order_import_image(interaction: discord.Interaction, image: discord.Attachment):
    if not is_order_thread(interaction.channel) or not staff_only(interaction):
        return await interaction.response.send_message("Staff only, inside an approved order thread.", ephemeral=True)
    if not image.content_type or not image.content_type.startswith("image/"):
        return await interaction.response.send_message("Please attach an image.", ephemeral=True)
    await interaction.response.send_message(
        f"Screenshot received for review: {image.filename}. Automated image reading is not configured yet; no order was created or modified.",
        ephemeral=True
    )

@bot.tree.command(name="order_status", description="Show the saved order checklist")
async def order_status(interaction: discord.Interaction):
    if not is_order_thread(interaction.channel):
        return await interaction.response.send_message("Use inside an approved order thread.", ephemeral=True)
    if not db.execute("SELECT 1 FROM orders WHERE thread_id=?", (interaction.channel.id,)).fetchone():
        return await interaction.response.send_message("No order imported yet.", ephemeral=True)
    await interaction.response.send_message(embed=embed_for(interaction.channel.id), ephemeral=True)

if __name__ == "__main__":
    if not TOKEN or not FORUMS or not STAFF:
        raise SystemExit("Set DISCORD_TOKEN, ORDER_FORUM_IDS, and STAFF_ROLE_IDS in .env")
    bot.run(TOKEN)
