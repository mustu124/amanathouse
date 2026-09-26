# Amanat House Admin Guide

A plain-English guide to running the Amanat House website day-to-day. No
technical knowledge needed.

## Logging in

1. Go to `yoursite.com/admin` (replace with your real website address).
2. Enter the email and password you were given.
3. Click **Sign In**.

If you're ever logged out unexpectedly in the middle of working, that's
normal — just log back in and continue. Your work is saved as you go (see
"Don't worry about losing your work" below).

## Adding a new product

1. In the left menu, click **Products**, then **Add New Product** (top
   right).
2. Fill in the basics:
   - **Name** — e.g. "Classic Gold Band Ring"
   - **Category** — pick from the dropdown (Rings, Necklaces, etc.)
   - **Price** — in rupees, numbers only
   - **Original Price** — only fill this in if you want to show a
     strikethrough "was" price. Leave it as 0 otherwise.
   - **Stock Count** — how many you have to sell
   - **Description** — a short paragraph customers will read
3. Under **Jewellery Details**, fill in what's true for this piece:
   material, plating, metal tone, size, weight, whether it's waterproof and
   anti-tarnish, and any badges (Bestseller, New, etc.) you want to show.
4. Scroll to **Images** (see below) and upload at least one photo.
5. At the bottom, click:
   - **Save Draft** — saves your work but keeps it hidden from customers.
     Use this if you're not finished yet.
   - **Publish** — saves it AND makes it live on the website immediately.

You can always come back and click Publish later once a draft is ready.

## Uploading photos

1. On the product page, scroll to the **Images** section.
2. Click the dashed box (or drag photos into it) to upload. You can select
   several photos at once.
3. Each photo shows a progress bar while it uploads. Wait for all of them to
   finish (100%) before clicking Save Draft or Publish.
4. Photos must be JPG, PNG, or WebP, under 10MB, and at least 400×400 pixels
   — you'll get a clear message if a photo doesn't meet these.
5. **Reordering**: press and drag a photo to change its position. The first
   photo is what customers see first in listings.
6. **Removing a photo**: click the red **Delete** button on that photo.

## Changing a price

1. Click **Products** in the left menu.
2. Find the product and click **Edit**.
3. Update the **Price** (or **Original Price** for a "was" price).
4. Click **Publish** to make the new price live immediately.

## Marking something out of stock

1. Click **Products**, then **Edit** on that product.
2. Set **Stock Count** to `0`.
3. The "In Stock" checkbox will automatically switch off — you don't need to
   touch it separately.
4. Click **Publish**. Customers will now see "Out of Stock" and won't be able
   to add it to their cart.

To bring it back: set the Stock Count above 0 again and Publish.

## Removing a product from the website

Click **Archive** on a product in the Products list. This hides it from the
website immediately, but keeps a copy of it in your records — so old orders
that included this product still show the right details. It's not gone
forever: open it again from the Products list and click **Publish** to bring
it back.

## Managing categories

1. Click **Categories** in the left menu.
2. For each category you can change the **photo** (click "Upload Photo"),
   **name**, **description**, and **subcategories**.
3. **Reordering categories**: press and drag the handle (⠿) on the left of a
   category card to change the order they appear on the homepage and in the
   shop filters.
4. Toggle **Visible** off to hide a category without deleting it.
5. Click **Save Categories** when you're done. Nothing changes on the live
   website until you click Save.

## Gift hampers (build-your-own)

A hamper is a gift set that the **customer builds themselves**. You decide which pieces they can choose from and how the price works; they pick the pieces and watch the price update.

### Creating a hamper
1. Go to **Hampers** in the left menu and press **Add New Hamper**.
2. **Details** - give it a name (for example "The Everyday Edit"), a short line for the hampers page and a longer description for the hamper's own page. The web address is made from the name; you can change it.
3. **Images** - upload one hero photo: the single showcase picture of the hamper look. Use a portrait 4:5 photo, at least 1200 x 1500 px, JPG/PNG/WebP under 10MB (an ivory or neutral background works best). Extra gallery photos are optional.
4. **Pricing** - choose one:
   - **Percentage off** - the customer pays the total of the pieces they pick minus your discount (0 to 90 percent). More pieces means a bigger saving.
   - **Fixed price** - the customer pays one flat price no matter which pieces they choose (the shop shows what the pieces are "worth").
   - **Packaging fee** - optional; added after any discount. Leave it at 0 for free packaging.
5. **Rules** - the minimum number of pieces, and the maximum (leave blank for no limit).
6. **Eligible products** - search or filter, then tick the products customers may choose from. In the "Selected" list you can reorder them and tick **Required** on a piece you want locked into every hamper (it is pre-added and cannot be removed). You need at least as many eligible products as the minimum.
7. **Live price preview** - as you change the numbers, the preview shows a worked example, for example: *customer picks 3 items worth Rs 1,797 -> discount 15% (-Rs 269.55) -> + Rs 0 packaging -> pays Rs 1,527.45, saves Rs 269.55.* Tick different pieces to test other baskets.
8. Tick **Active** and press **Create hamper**. If something is wrong (for example a discount above 90 percent), the page tells you in plain words and does not save.

### What the customer sees
- On the homepage a **Hampers** circle sits after the other categories; it opens the **Hampers** page, and each hamper has its own page.
- At the top is your hero photo with the offer ("Save 15% when you build your own" or "Build yours for Rs 1,499").
- Below it they add pieces from your list. The summary (on the right on a computer, along the bottom on a phone) shows their pieces, the discount, the total and how much they save, and tells them how many more pieces they need. **Add hamper to cart** stays greyed out, with the reason, until the rules are met.
- In the cart the hamper is **one line** that expands to show its contents. They can change the quantity, remove it, or press **Edit hamper** to rebuild it.
- If a piece in a hamper later goes out of stock or its price changes, the cart shows a notice on that line and the customer has to confirm or edit it before checking out. Prices are never changed silently.
- The order message on WhatsApp lists the hamper, every piece inside it, and the subtotal, discount and hamper total.

### Editing, hiding and deleting
- Use the **Active / Hidden** button in the Hampers list to show or hide a hamper instantly, and the **Order** box to change where it appears.
- **Delete** removes a hamper nobody has ordered. If the hamper is in past orders it is **archived instead** (hidden from the shop) so your order history stays complete - the system tells you when this happens.
- Changing a piece's price later never changes old orders: each order keeps a frozen copy of what was in the hamper and what it cost.

## Reading an order

1. Click **Orders** in the left menu.
2. Every order placed on the website appears here automatically —
   customers complete their order by sending a message on WhatsApp, and it's
   recorded here at the same time.
3. Click any order row to see the full details: what they ordered, their
   name, phone, delivery address, and pincode.
4. Use the **Status** dropdown on each order to update it as you process it
   (pending → confirmed → shipped → delivered). This is just for your own
   tracking — customers aren't notified automatically.
5. Click **Message** (or **Message on WhatsApp** in the order detail view)
   to open a WhatsApp chat with that customer, pre-filled with an update
   about their order.
6. Use the status and date filters at the top to find older orders.

## Don't worry about losing your work

While editing a product, homepage settings, or categories, your changes are
automatically kept in your browser as you type. If you accidentally close the
tab or get logged out before saving, come back and you'll be offered your
unsaved draft to restore.

## If something goes wrong

- **A red error message (toast) appears** — read it, it usually says exactly
  what to fix (e.g. "That slug is already used by another product").
- **You get logged out while working** — just log back in; this can happen
  after about an hour of being signed in and is expected, not a bug.
- **A photo won't upload** — check it's a JPG, PNG, or WebP file, under 10MB,
  and at least 400×400 pixels.
- **Still stuck** — contact whoever set up your website for you.

## Setting a shipping fee

Go to **Site Settings** and find the **Shipping** section. Enter a flat amount in rupees — it is added to every order's total automatically, on top of whatever the customer's items (and any hampers) cost. Set it to 0 for free shipping. The fee shown to a customer is always the current one; changing it never rewrites the total of an order already placed.
